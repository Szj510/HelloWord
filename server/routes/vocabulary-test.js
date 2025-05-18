const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const VocabularyTest = require('../models/VocabularyTest');
const Word = require('../models/Word');
const mongoose = require('mongoose');
const dayjs = require('dayjs');

// 单词难度分级对应表 (用于抽样和计算)
const DIFFICULTY_LEVELS = {
  beginner: { range: [1], count: 15, threshold: 0.8 },
  elementary: { range: [1, 2], count: 15, threshold: 0.75 },
  intermediate: { range: [2, 3], count: 20, threshold: 0.7 },
  upper_intermediate: { range: [3, 4], count: 20, threshold: 0.65 },
  advanced: { range: [4, 5], count: 15, threshold: 0.6 },
  proficient: { range: [5], count: 15, threshold: 0.55 }
};

// 词汇量级别对应的估计词汇量
const VOCABULARY_ESTIMATES = {
  beginner: 1000,
  elementary: 3000,
  intermediate: 6000,
  upper_intermediate: 10000,
  advanced: 15000,
  proficient: 20000
};

// @route   POST api/vocabulary-test/start
// @desc    开始新的词汇量测试
// @access  Private
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 检查用户是否有正在进行的测试
    const inProgressTest = await VocabularyTest.findOne({
      user: userId,
      status: 'in_progress'
    });
    
    if (inProgressTest) {
      // 返回进行中的测试
      return res.json({
        msg: '您有一个进行中的测试',
        test: inProgressTest
      });
    }
    
    // 从所有难度级别中抽取适当数量的单词
    let testWords = [];
    for (const level in DIFFICULTY_LEVELS) {
      const { range, count } = DIFFICULTY_LEVELS[level];
      
      // 查询符合难度范围的单词
      const words = await Word.aggregate([
        { $match: { difficulty: { $in: range } } },
        { $sample: { size: count } }, // 随机抽样
        { $project: { _id: 1, spelling: 1, meaning: 1, difficulty: 1 } }
      ]);
      
      // 添加到测试单词列表
      words.forEach(word => {
        testWords.push({
          word: word._id,
          difficulty: word.difficulty,
          // 其他字段会在用户回答时填写
        });
      });
    }
    
    // 打乱单词顺序
    testWords.sort(() => Math.random() - 0.5);
    
    // 创建新的测试记录
    const newTest = new VocabularyTest({
      user: userId,
      totalWords: testWords.length,
      testWords: testWords
    });
    
    await newTest.save();
    
    // 查询单词详情以返回给前端
    const wordIds = testWords.map(tw => tw.word);
    const wordDetails = await Word.find(
      { _id: { $in: wordIds } },
      { spelling: 1, meaning: 1, difficulty: 1 }
    );
    
    // 构建返回的测试数据(包含单词详情)
    const testWithWordDetails = {
      ...newTest.toObject(),
      testWords: testWords.map(testWord => {
        const wordDetail = wordDetails.find(w => w._id.toString() === testWord.word.toString());
        return {
          ...testWord,
          wordDetail
        };
      })
    };
    
    res.json({
      msg: '词汇量测试已创建',
      test: testWithWordDetails
    });
    
  } catch (err) {
    console.error('创建词汇量测试错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   POST api/vocabulary-test/:testId/answer
// @desc    提交单词测试答案
// @access  Private
router.post('/:testId/answer', authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    const { wordId, answer } = req.body;
    
    if (!wordId || answer === undefined) {
      return res.status(400).json({ msg: '缺少必要参数' });
    }
    
    // 验证测试ID和单词ID
    if (!mongoose.Types.ObjectId.isValid(testId) || !mongoose.Types.ObjectId.isValid(wordId)) {
      return res.status(400).json({ msg: '无效的ID格式' });
    }
    
    // 获取测试记录
    const test = await VocabularyTest.findOne({
      _id: testId,
      user: userId,
      status: 'in_progress'
    });
    
    if (!test) {
      return res.status(404).json({ msg: '未找到进行中的测试' });
    }
    
    // 获取单词信息
    const word = await Word.findById(wordId, { spelling: 1, meaning: 1 });
    if (!word) {
      return res.status(404).json({ msg: '未找到指定单词' });
    }
    
    // 检查单词是否在测试中
    const testWordIndex = test.testWords.findIndex(tw => tw.word.toString() === wordId);
    if (testWordIndex === -1) {
      return res.status(400).json({ msg: '此单词不在当前测试中' });
    }
    
    // 判断答案是否正确 (简单判断：用户知道这个单词则认为正确)
    const isCorrect = answer === true;
    
    // 更新测试记录中的该单词
    test.testWords[testWordIndex].userAnswer = answer.toString();
    test.testWords[testWordIndex].isCorrect = isCorrect;
    test.testWords[testWordIndex].answeredAt = new Date();
    
    // 更新测试统计数据
    if (isCorrect) {
      test.correctAnswers += 1;
    } else {
      test.incorrectAnswers += 1;
    }
    
    // 检查是否所有单词都已回答
    const answeredCount = test.correctAnswers + test.incorrectAnswers;
    if (answeredCount >= test.totalWords) {
      // 计算测试结果
      let highestPassedLevel = 'beginner';
      
      // 计算每个级别的通过情况
      for (const level in DIFFICULTY_LEVELS) {
        const { range, threshold } = DIFFICULTY_LEVELS[level];
        
        // 筛选此级别的单词
        const levelWords = test.testWords.filter(tw => range.includes(tw.difficulty));
        if (levelWords.length === 0) continue;
        
        // 计算此级别的正确率
        const correctCount = levelWords.filter(tw => tw.isCorrect).length;
        const levelAccuracy = correctCount / levelWords.length;
        
        // 判断是否通过此级别
        if (levelAccuracy >= threshold) {
          highestPassedLevel = level;
        } else {
          // 找到没通过的级别就停止
          break;
        }
      }
      
      // 设置测试结果
      test.status = 'completed';
      test.completedAt = new Date();
      test.level = highestPassedLevel;
      test.estimatedVocabulary = VOCABULARY_ESTIMATES[highestPassedLevel];
    }
    
    await test.save();
    
    res.json({
      msg: '答案已提交',
      test: test
    });
    
  } catch (err) {
    console.error('提交测试答案错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   GET api/vocabulary-test/current
// @desc    获取当前进行中的测试或最近完成的测试
// @access  Private
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 首先检查是否有进行中的测试
    let test = await VocabularyTest.findOne({
      user: userId,
      status: 'in_progress'
    }).sort({ startedAt: -1 });
    
    if (!test) {
      // 如果没有进行中的测试，返回最近完成的测试
      test = await VocabularyTest.findOne({
        user: userId,
        status: 'completed'
      }).sort({ completedAt: -1 });
    }
    
    if (!test) {
      return res.json({ msg: '未找到测试记录' });
    }
    
    // 获取测试中单词的详细信息
    const wordIds = test.testWords.map(tw => tw.word);
    const words = await Word.find(
      { _id: { $in: wordIds } },
      { spelling: 1, meaning: 1, examples: 1, difficulty: 1 }
    );
    
    // 将单词详情添加到测试数据中
    const testWithWordDetails = {
      ...test.toObject(),
      testWords: test.testWords.map(testWord => {
        const wordDetail = words.find(w => w._id.toString() === testWord.word.toString());
        return {
          ...testWord.toObject(),
          wordDetail
        };
      })
    };
    
    res.json({ test: testWithWordDetails });
    
  } catch (err) {
    console.error('获取当前测试错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   GET api/vocabulary-test/history
// @desc    获取用户的测试历史记录
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;
    
    // 查询已完成的测试
    const tests = await VocabularyTest.find({
      user: userId,
      status: 'completed'
    })
    .select('-testWords') // 不返回详细测试单词以减少数据量
    .sort({ completedAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));
    
    // 获取总数
    const total = await VocabularyTest.countDocuments({
      user: userId,
      status: 'completed'
    });
    
    res.json({
      tests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (err) {
    console.error('获取测试历史错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   DELETE api/vocabulary-test/:testId
// @desc    放弃一个进行中的测试
// @access  Private
router.delete('/:testId', authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id;
    
    // 验证测试ID
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ msg: '无效的测试ID' });
    }
    
    // 查询测试
    const test = await VocabularyTest.findOne({
      _id: testId,
      user: userId,
      status: 'in_progress'
    });
    
    if (!test) {
      return res.status(404).json({ msg: '未找到进行中的测试' });
    }
    
    // 标记为放弃
    test.status = 'abandoned';
    await test.save();
    
    res.json({ msg: '测试已放弃' });
    
  } catch (err) {
    console.error('放弃测试错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   GET api/vocabulary-test/:id
// @desc    获取指定ID的测试详情
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;
    
    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ msg: '无效的测试ID格式' });
    }
    
    // 查询测试记录
    const test = await VocabularyTest.findOne({
      _id: testId,
      user: userId
    });
    
    if (!test) {
      return res.status(404).json({ msg: '未找到指定的测试记录' });
    }
    
    // 获取测试中单词的详细信息
    const wordIds = test.testWords.map(tw => tw.word);
    const words = await Word.find(
      { _id: { $in: wordIds } },
      { spelling: 1, meaning: 1, examples: 1, difficulty: 1 }
    );
    
    // 将单词详情添加到测试数据中
    const testWithWordDetails = {
      ...test.toObject(),
      testWords: test.testWords.map(testWord => {
        const wordDetail = words.find(w => w._id.toString() === testWord.word.toString());
        return {
          ...testWord.toObject(),
          wordDetail
        };
      })
    };
    
    res.json({ test: testWithWordDetails });
    
  } catch (err) {
    console.error('获取测试记录错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router; 