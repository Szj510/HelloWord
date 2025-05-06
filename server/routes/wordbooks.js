const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // 引入认证中间件
const WordBook = require('../models/WordBook'); // 引入 WordBook 模型
const Word = require('../models/Word'); // 引入 Word 模型
const LearningRecord = require('../models/LearningRecord');
const mongoose = require('mongoose'); // 用于验证 ObjectId

// --- 获取预设单词书列表 ---
// @route   GET api/wordbooks/presets
// @desc    获取系统预设的单词书列表
// @access  Public
router.get('/presets', async (req, res) => {
    try {
        // 预设单词书列表
        const presets = [
            {
                id: 'CET4',
                name: '大学英语四级词汇',
                description: '包含大学英语四级考试常见词汇，约4000个单词',
                wordCount: 4000,
                level: '中级',
                category: '考试'
            },
            {
                id: 'CET6', 
                name: '大学英语六级词汇',
                description: '包含大学英语六级考试常见词汇，约6000个单词',
                wordCount: 6000,
                level: '中高级',
                category: '考试'
            },
            {
                id: 'GaoKao',
                name: '高考英语词汇',
                description: '高中英语教学大纲规定的3500个单词和短语',
                wordCount: 3500,
                level: '中级',
                category: '考试'
            },
            {
                id: 'KaoYan',
                name: '考研英语词汇',
                description: '考研英语必备词汇，约5500个单词',
                wordCount: 5500,
                level: '高级',
                category: '考试'
            },
            {
                id: 'IELTS',
                name: '雅思核心词汇',
                description: 'IELTS考试必备词汇，涵盖听说读写各部分',
                wordCount: 4500,
                level: '高级',
                category: '留学'
            },
            {
                id: 'IELTS_Disorder',
                name: '雅思词汇（乱序版）',
                description: 'IELTS考试必备词汇（乱序学习）',
                wordCount: 4500,
                level: '高级',
                category: '留学'
            },
            {
                id: '4000EEW_Meaning',
                name: '4000基本英语词汇',
                description: '日常交流中最常用的4000个英语单词',
                wordCount: 4000,
                level: '初级',
                category: '基础'
            },
            {
                id: '4000EEW_Sentence',
                name: '4000基本英语词汇（例句版）',
                description: '带例句的4000基本英语词汇',
                wordCount: 4000,
                level: '初级',
                category: '基础'
            },
            {
                id: '2025KaoYan',
                name: '2025考研红宝书词汇',
                description: '2025年考研英语必备词汇大全',
                wordCount: 5500,
                level: '高级',
                category: '考试'
            },
            {
                id: '2026KaoYan',
                name: '2026考研红宝书词汇',
                description: '2026年考研英语必备词汇大全',
                wordCount: 5500,
                level: '高级',
                category: '考试'
            }
        ];
        
        res.json(presets);
    } catch (err) {
        console.error('获取预设单词书列表错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 从预设单词书导入创建新单词书 ---
// @route   POST api/wordbooks/import
// @desc    基于预设ID导入单词书
// @access  Private
router.post('/import', authMiddleware, async (req, res) => {
    const { presetId } = req.body; // 获取预设ID
    const userId = req.user.id;

    // 1. 验证输入
    if (!presetId) {
        return res.status(400).json({ msg: '缺少 presetId 参数' });
    }

    // 预设ID映射到对应的标签和名称
    const presetMap = {
        'CET4': { tag: 'CET4', name: '大学英语四级词汇', description: '包含大学英语四级考试常见词汇' },
        'CET6': { tag: 'CET6', name: '大学英语六级词汇', description: '包含大学英语六级考试常见词汇' },
        'GaoKao': { tag: 'GaoKao', name: '高考英语词汇', description: '高中英语教学大纲规定的词汇' },
        'KaoYan': { tag: 'KaoYan', name: '考研英语词汇', description: '考研英语必备词汇' },
        'IELTS': { tag: 'IELTS', name: '雅思核心词汇', description: 'IELTS考试必备词汇' },
        'IELTS_Disorder': { tag: 'IELTS_Disorder', name: '雅思词汇（乱序版）', description: 'IELTS考试必备词汇（乱序版）' },
        '4000EEW_Meaning': { tag: '4000EEW_Meaning', name: '4000基本英语词汇', description: '日常交流中最常用的英语单词' },
        '4000EEW_Sentence': { tag: '4000EEW_Sentence', name: '4000基本英语词汇（例句版）', description: '带例句的4000基本英语词汇' },
        '2025KaoYan': { tag: '2025KaoYan', name: '2025考研红宝书词汇', description: '2025年考研英语必备词汇大全' },
        '2026KaoYan': { tag: '2026KaoYan', name: '2026考研红宝书词汇', description: '2026年考研英语必备词汇大全' }
    };

    // 检查是否是有效的预设ID
    if (!presetMap[presetId]) {
        return res.status(400).json({ msg: `无效的预设单词书ID: ${presetId}` });
    }

    const { tag: dictionaryTag, name, description } = presetMap[presetId];

    try {
        // 2. 根据标签查找所有对应的单词 ID
        // 使用 lean() 提高性能，因为只需要 _id
        const words = await Word.find({ tags: dictionaryTag }).select('_id').lean();
        const wordIds = words.map(w => w._id); // 提取 ObjectId 数组

        if (wordIds.length === 0) {
            return res.status(404).json({ msg: `未找到标签为 "${dictionaryTag}" 的单词，无法创建单词书` });
        }

        // 3. 根据标签设置默认的 level 和 category
        let level = 'standard'; // 默认级别
        let category = '考试';   // 默认分类
        
        if (presetId.includes('IELTS')) {
            category = '留学';
            level = 'advanced';
        } else if (presetId.includes('CET4') || presetId.includes('GaoKao')) {
            level = 'intermediate';
        } else if (presetId.includes('CET6') || presetId.includes('KaoYan')) {
            level = 'advanced';
        } else if (presetId.includes('4000EEW')) {
            category = '基础';
            level = 'basic';
        }

        // 4. 创建新的单词书实例
        const newWordBook = new WordBook({
            name,                 // 使用预设的名称
            description,          // 使用预设的描述
            level,
            category,
            owner: userId,
            words: wordIds,       // 直接使用查找到的单词 ID 数组
            isPublic: false,      // 导入的单词书默认为用户私有
        });

        // 5. 保存单词书到数据库
        const savedWordBook = await newWordBook.save();
        
        // 6. 为前端返回值添加totalWords字段
        const wordbookWithStats = {
            ...savedWordBook.toObject(),
            totalWords: wordIds.length,
            learnedCount: 0,
            masteredCount: 0
        };

        // 7. 返回创建成功的单词书
        res.status(201).json(wordbookWithStats);
    } catch (err) {
        console.error(`从预设ID "${presetId}" 导入单词书错误:`, err.message);
        // 检查是否是唯一键冲突
        if (err.code === 11000) {
            return res.status(400).json({ msg: '创建单词书失败，可能名称已存在或存在唯一性问题' });
        }
        res.status(500).send('服务器错误');
    }
});

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