const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // 引入认证中间件
const WordBook = require('../models/WordBook'); // 引入 WordBook 模型
const Word = require('../models/Word'); // 引入 Word 模型
const LearningRecord = require('../models/LearningRecord');
const mongoose = require('mongoose'); // 用于验证 ObjectId

// --- 创建新的单词书 ---
// @route   POST api/wordbooks
// @desc    创建一个新的单词书
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, level, category, isPublic } = req.body;

  // 简单验证
  if (!name) {
    return res.status(400).json({ msg: '单词书名称不能为空' });
  }

  try {
    const newWordBook = new WordBook({
      name,
      description,
      level,
      category,
      isPublic: isPublic || false,
      owner: req.user.id,
      words: []
    });
    const wordbook = await newWordBook.save();
    res.status(201).json(wordbook);
  } catch (err) {
    console.error('创建单词书错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// --- 获取当前用户的所有单词书 ---
// @route   GET api/wordbooks
// @desc    获取当前登录用户创建的所有单词书
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // 获取用户的所有单词书
    const wordbooks = await WordBook.find({ owner: userId }).sort({ updatedAt: -1 });
    
    // 获取学习记录以计算统计数据
    const learningRecords = await LearningRecord.find({ user: userId });
    
    // 创建单词ID到学习状态的映射
    const wordStatusMap = {};
    learningRecords.forEach(record => {
      const wordId = record.word.toString();
      const isMastered = record.status === 'Mastered' || record.familiarity >= 3;
      
      // 记录单词状态
      wordStatusMap[wordId] = {
        learned: true,
        mastered: isMastered
      };
    });
    
    // 为每个单词书计算统计数据
    const wordbooksWithStats = await Promise.all(wordbooks.map(async (wordbook) => {
      const wordbookObj = wordbook.toObject();
      
      // 总单词数就是words数组的长度
      const totalWords = wordbookObj.words.length;
      
      // 计算已学习和已掌握的单词数
      let learnedCount = 0;
      let masteredCount = 0;
      
      wordbookObj.words.forEach(wordId => {
        const wordIdStr = wordId.toString();
        if (wordStatusMap[wordIdStr]) {
          if (wordStatusMap[wordIdStr].learned) learnedCount++;
          if (wordStatusMap[wordIdStr].mastered) masteredCount++;
        }
      });
      
      // 添加统计数据
      return {
        ...wordbookObj,
        totalWords,
        learnedCount,
        masteredCount
      };
    }));
    
    res.json(wordbooksWithStats);
  } catch (err) {
    console.error('获取单词书列表错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// --- 获取特定单词书的详情 (修改: 包含用户学习状态) ---
// @route   GET api/wordbooks/:id
// @desc    获取指定 ID 的单词书详情 (包含单词列表及其学习状态)
// @access  Private (需要验证所有权)
router.get('/:id', authMiddleware, async (req, res) => {
  const wordbookId = req.params.id;
  const userId = req.user.id;
  // 添加分页支持
  const page = parseInt(req.query.page) || 1; // 默认第1页
  const limit = parseInt(req.query.limit) || 50; // 默认每页50个单词
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(wordbookId)) {
      return res.status(400).json({ msg: '无效的单词书 ID' });
  }

  try {
    // 1. 先查找单词书基本信息，不包括单词列表
    const wordbook = await WordBook.findById(wordbookId).lean();

    if (!wordbook) { return res.status(404).json({ msg: '单词书未找到' }); }
    if (wordbook.owner.toString() !== userId) { return res.status(403).json({ msg: '无权访问此单词书' }); }
    
    // 获取单词书中的单词总数
    const totalWords = wordbook.words.length;

    // 使用skip和limit实现分页
    // 获取当前页的单词ID
    const pageWordIds = wordbook.words.slice(skip, skip + limit);

    // 2. 根据分页后的单词ID获取单词详情
    const pageWords = await Word.find({
      _id: { $in: pageWordIds }
    }).select('spelling phonetic meaning difficulty tags').lean();

    // 如果当前页没有单词，直接返回
    if (!pageWords || pageWords.length === 0) {
      return res.json({ 
        ...wordbook, 
        words: [], 
        pagination: {
          total: totalWords,
          page,
          limit,
          totalPages: Math.ceil(totalWords / limit)
        }
      });
    }

    // 3. 获取这些单词的学习记录状态
    const learningRecords = await LearningRecord.find({
        user: userId,
        word: { $in: pageWordIds } // 查询条件：用户 ID 和 当前页的单词 ID 列表
    }).select('word status').lean(); // 只选择 word ID 和 status 字段

    // 4. 创建一个 单词ID -> 状态 的映射，方便查找
    const statusMap = learningRecords.reduce((map, record) => {
        // record.word 是 ObjectId，需要转为字符串作为 key
        map[record.word.toString()] = record.status;
        return map;
    }, {});

    // 5. 将学习状态合并到单词数据中
    const wordsWithStatus = pageWords.map(word => ({
        ...word, // 展开原始单词信息 (spelling, phonetic, etc.)
        // 从 map 中查找状态，如果找不到（说明用户还没学过这个词），则默认为 'New'
        status: statusMap[word._id.toString()] || 'New'
    }));

    // 6. 返回带分页信息的数据
    res.json({ 
      ...wordbook, 
      words: wordsWithStatus,
      pagination: {
        total: totalWords,
        page,
        limit,
        totalPages: Math.ceil(totalWords / limit)
      }
    });

  } catch (err) {
    console.error('获取单词书详情错误:', err.message);
    if (err.kind === 'ObjectId') { return res.status(404).json({ msg: '单词书未找到 (无效ID)' }); }
    res.status(500).send('服务器错误');
  }
})

// --- 添加单词到单词书 ---
// @route   POST api/wordbooks/:id/words
// @desc    将一个单词添加到指定的单词书中
// @access  Private
router.post('/:id/words', authMiddleware, async (req, res) => {
  const { wordId } = req.body;
  const wordbookId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(wordbookId)) { return res.status(400).json({ msg: '无效的单词书 ID' }); }
  if (!mongoose.Types.ObjectId.isValid(wordId)) { return res.status(400).json({ msg: '无效的单词 ID' }); }

  try {
    const wordbook = await WordBook.findOne({ _id: wordbookId, owner: req.user.id }).lean(); // 使用 lean()
    if (!wordbook) { return res.status(404).json({ msg: '单词书未找到或无权访问' }); }

    const wordExists = await Word.findById(wordId).lean();
    if (!wordExists) { return res.status(404).json({ msg: '要添加的单词不存在' }); }

    const wordAlreadyInBook = wordbook.words.some(id => id.toString() === wordId);
    if (wordAlreadyInBook) { return res.status(400).json({ msg: '该单词已存在于此单词书中' }); }

    const updateResult = await WordBook.updateOne(
        { _id: wordbookId, owner: req.user.id },
        { $addToSet: { words: wordId }, $set: { updatedAt: Date.now() } }
    );

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
        return res.status(200).json({ msg: '单词已在该单词书中' });
    }
     if (updateResult.matchedCount === 0) {
         return res.status(404).json({ msg: '单词书未找到或无权访问' });
     }

    res.json({ msg: '单词成功添加到单词书' });

  } catch (err) {
    console.error('添加单词到单词书错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// --- 从预设词典标签导入创建新单词书 ---
// @route   POST api/wordbooks/import
// @desc    基于一个标签 (如 'CET4') 创建一个新的、预填充单词的单词书
// @access  Private
router.post('/import', authMiddleware, async (req, res) => {
    const { dictionaryTag, name, description } = req.body; // 获取标签、新书名称、描述
    const userId = req.user.id;

    // 1. 验证输入
    if (!dictionaryTag || !name) {
        return res.status(400).json({ msg: '缺少 dictionaryTag 或 name 参数' });
    }

    // (可选) 验证 dictionaryTag 是否在预定义的标签列表内
    const allowedTags = [
        'CET4', 'CET6', 'GaoKao', 'KaoYan', 'IELTS', 'IELTS_Disorder', 
        '4000EEW_Meaning', '4000EEW_Sentence', '2025KaoYan', '2026KaoYan', 'Special'
    ];
    if (!allowedTags.includes(dictionaryTag)) {
        return res.status(400).json({ msg: `无效的词典标签: ${dictionaryTag}` });
    }

    try {
        // 2. 根据标签查找所有对应的单词 ID
        // 使用 lean() 提高性能，因为只需要 _id
        const words = await Word.find({ tags: dictionaryTag }).select('_id').lean();
        const wordIds = words.map(w => w._id); // 提取 ObjectId 数组

        if (wordIds.length === 0) {
            return res.status(404).json({ msg: `未找到标签为 "${dictionaryTag}" 的单词，无法创建单词书` });
        }

        // 3. (可选) 根据标签设置默认的 level 和 category
        let level = dictionaryTag; // 简单地用标签作为级别
        let category = '考试';    // 假设这些都是考试类，可以根据需要调整
        if (dictionaryTag.includes('IELTS')) category = '留学';
        // ... 其他映射规则 ...

        // 4. 创建新的单词书实例
        const newWordBook = new WordBook({
            name,
            description,
            level: level,
            category: category,
            owner: userId,
            words: wordIds, // 直接使用查找到的单词 ID 数组
            isPublic: false, // 导入的单词书默认为用户私有
        });

        // 5. 保存单词书到数据库
        const savedWordBook = await newWordBook.save();

        // 6. 返回创建成功的单词书 (可以考虑是否填充单词信息)
        // 不填充，让前端需要时再去获取详情
        res.status(201).json(savedWordBook);

    } catch (err) {
        console.error(`从标签 "${dictionaryTag}" 导入单词书错误:`, err.message);
        // 检查是否是唯一键冲突（例如用户尝试用同一个名字创建两次？）
        // Mongoose 错误码 11000 通常表示唯一键冲突
        if (err.code === 11000) {
             return res.status(400).json({ msg: '创建单词书失败，可能名称已存在或存在唯一性问题' });
        }
        res.status(500).send('服务器错误');
    }
});

// --- 删除单词书 ---
// @route   DELETE api/wordbooks/:id
// @desc    删除指定 ID 的单词书
// @access  Private (需要验证所有权)
router.delete('/:id', authMiddleware, async (req, res) => {
    const wordbookId = req.params.id;
    const userId = req.user.id;

    // 1. 验证 ID 格式
    if (!mongoose.Types.ObjectId.isValid(wordbookId)) {
        return res.status(400).json({ msg: '无效的单词书 ID' });
    }

    try {
        // 2. 查找并删除属于该用户的单词书
        // 直接使用 deleteOne 并包含 owner 条件，确保用户只能删除自己的
        const deleteResult = await WordBook.deleteOne({ _id: wordbookId, owner: userId });

        // 3. 检查是否有文档被删除
        if (deleteResult.deletedCount === 0) {
            // 如果没有删除任何文档，说明单词书不存在或用户无权删除
            return res.status(404).json({ msg: '单词书未找到或无权删除' });
        }

        // 4. （可选）删除关联的学习记录？
        // 如果需要，可以在这里添加逻辑来删除与这个单词书相关的 LearningRecord
        // await LearningRecord.deleteMany({ user: userId, wordbook: wordbookId });
        // 这取决于你的业务逻辑，暂时我们只删除单词书本身。

        res.json({ msg: '单词书已成功删除' }); // 返回成功消息

    } catch (err) {
        console.error(`删除单词书 ${wordbookId} 错误:`, err.message);
        res.status(500).send('服务器错误');
    }
});

// --- TODO: 后续添加更新、删除、删除单词的路由 ---
// router.put('/:id', authMiddleware, async (req, res) => { /* 更新逻辑 */ });
// router.delete('/:id', authMiddleware, async (req, res) => { /* 删除逻辑 */ });
// router.delete('/:id/words/:wordId', authMiddleware, async (req, res) => { /* 删除单词逻辑 */ });
// --- 从单词书中移除一个单词 ---
// @route   DELETE api/wordbooks/:id/words/:wordId
// @desc    从指定的单词书中移除指定的单词
// @access  Private (需要验证单词书所有权)
router.delete('/:id/words/:wordId', authMiddleware, async (req, res) => {
    const { id: wordbookId, wordId: wordIdToRemove } = req.params; // 获取单词书ID和要移除的单词ID
    const userId = req.user.id;

    // 1. 验证 ID 格式
    if (!mongoose.Types.ObjectId.isValid(wordbookId)) {
        return res.status(400).json({ msg: '无效的单词书 ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(wordIdToRemove)) {
        return res.status(400).json({ msg: '无效的单词 ID' });
    }

    try {
        // 2. 更新单词书，使用 $pull 操作符移除数组中的元素
        const updateResult = await WordBook.updateOne(
            { _id: wordbookId, owner: userId }, // 条件：匹配单词书 ID 和拥有者
            {
                $pull: { words: wordIdToRemove }, // 从 words 数组中移除指定的 wordIdToRemove
                $set: { updatedAt: Date.now() }    // 更新时间戳
            }
        );

        // 3. 检查更新结果
        if (updateResult.matchedCount === 0) {
             // 没有找到匹配的单词书（或用户无权访问）
            return res.status(404).json({ msg: '单词书未找到或无权修改' });
        }
        if (updateResult.modifiedCount === 0) {
             // 找到了单词书，但没有进行修改（说明该单词原本就不在书中）
            // 这种情况可以返回成功，也可以返回特定提示，看业务需求
            return res.status(200).json({ msg: '单词未在该单词书中找到，无需移除' });
        }

        res.json({ msg: '单词已成功从单词书中移除' });

    } catch (err) {
        console.error(`从单词书 ${wordbookId} 移除单词 ${wordIdToRemove} 错误:`, err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取单个单词书的统计信息 (用于计划计算) ---
// @route   GET api/wordbooks/:id/stats
// @desc    获取指定单词书的总词数及用户学习统计
// @access  Private (需要验证所有权)
router.get('/:id/stats', authMiddleware, async (req, res) => {
    const wordbookId = req.params.id;
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (!mongoose.Types.ObjectId.isValid(wordbookId)) {
        return res.status(400).json({ msg: '无效的单词书 ID' });
    }

    try {
        // 1. 查找单词书并验证所有权，获取单词 ID 列表
        const wordbook = await WordBook.findOne({ _id: wordbookId, owner: userId })
                                      .select('words') // 只需要 words 数组
                                      .lean();

        if (!wordbook) { return res.status(404).json({ msg: '单词书未找到或无权访问' }); }

        const wordIds = wordbook.words || [];
        const totalWords = wordIds.length;

        if (totalWords === 0) {
             // 如果单词书为空，直接返回统计信息
             return res.json({
                 wordbookId: wordbookId,
                 totalWords: 0,
                 learnedWordsCount: 0,
                 masteredWordsCount: 0,
                 remainingNewWords: 0
             });
         }


        // 2. 统计用户对这些单词的学习记录
        const userRecordsStats = await LearningRecord.aggregate([
            {
                // 匹配当前用户以及该单词书中的单词
                $match: {
                    user: userObjectId,
                    word: { $in: wordIds } // $in 操作符匹配数组中的任何值
                }
            },
            {
                // 按状态分组计数
                $group: {
                    _id: '$status', // 按 status 字段分组 ('Learning', 'Reviewing', 'Mastered')
                    count: { $sum: 1 } // 计算每个状态的数量
                }
            }
        ]);

        // 3. 整理统计结果
        let learnedWordsCount = 0; // 有记录就算学过
        let masteredWordsCount = 0;
        userRecordsStats.forEach(stat => {
            learnedWordsCount += stat.count; // 所有状态的都算学过
            if (stat._id === 'Mastered') {
                masteredWordsCount = stat.count;
            }
        });

        const remainingNewWords = totalWords - learnedWordsCount;

        res.json({
            wordbookId: wordbookId,
            totalWords: totalWords,           // 总词数
            learnedWordsCount: learnedWordsCount,     // 已学（有记录）单词数
            masteredWordsCount: masteredWordsCount,    // 已掌握单词数
            remainingNewWords: remainingNewWords < 0 ? 0 : remainingNewWords // 剩余未学新词数 (防止负数)
        });

    } catch (err) {
        console.error(`获取单词书 ${wordbookId} 统计错误:`, err.message);
        res.status(500).send('服务器错误');
    }
});

module.exports = router; // 确保导出了 router