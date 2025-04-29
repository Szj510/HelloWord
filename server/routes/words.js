const express = require('express');
const router = express.Router();
const Word = require('../models/Word'); // 引入 Word 模型
const mongoose = require('mongoose'); // 用于验证 ObjectId

// --- 获取/搜索单词列表 (支持分页和搜索) ---
// @route   GET api/words
// @desc    获取单词列表，支持按拼写搜索、词性过滤和分页
// @access  Public (假设单词列表是公开可查的)
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 20, pos } = req.query; // 获取查询参数

  try {
    // 构建查询条件
    const query = {};
    if (search) {
      // 如果有搜索词，则按拼写进行模糊匹配 (不区分大小写)
      query.spelling = { $regex: search, $options: 'i' };
    }
    
    if (pos && pos !== 'all') {
      // 简化的词性过滤方式，使用$and操作符正确组合条件
      switch(pos) {
        case 'n': // 名词
          // 精确匹配名词，排除副词
          query.partOfSpeech = { 
            $regex: '\\bn\\.', // 词性边界后跟n.
            $not: /adv\./ // 不含adv.
          };
          break;
        case 'v': // 动词
          // 精确匹配动词，排除副词
          query.partOfSpeech = { 
            $regex: '\\bv\\.', // 词性边界后跟v.
            $not: /adv\./ // 不含adv.
          };
          break;
        case 'adj': // 形容词
          query.partOfSpeech = { $regex: '\\badj\\.', $options: 'i' };
          break;
        case 'adv': // 副词
          query.partOfSpeech = { $regex: '\\badv\\.', $options: 'i' };
          break;
        default: // 其他词性使用简单匹配
          query.partOfSpeech = { $regex: pos, $options: 'i' };
      }
    }
    // TODO: 后续可以添加按 tags 等字段过滤的功能
    // if (tags) { query.tags = { $in: tags.split(',') }; }

    // 计算分页参数
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // 同时执行查询和计数
    const [words, totalCount] = await Promise.all([
      Word.find(query) // 查询单词
          .limit(limitNum) // 限制数量
          .skip(skip) // 跳过前面的文档
          .sort({ spelling: 1 }), // 按拼写排序 (可选)
      Word.countDocuments(query) // 获取匹配的总数
    ]);

    // 构造响应数据，包含单词列表和分页信息
    const response = {
      words,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalWords: totalCount,
    };

    res.json(response);

  } catch (err) {
    console.error('获取单词列表错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// --- 获取特定单词的详情 ---
// @route   GET api/words/:id
// @desc    获取指定 ID 的单词详情
// @access  Public (假设单词详情是公开可查的)
router.get('/:id', async (req, res) => {
  // 验证 ID 是否有效
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: '无效的单词 ID' });
  }

  try {
    const word = await Word.findById(req.params.id);

    if (!word) {
      return res.status(404).json({ msg: '单词未找到' });
    }

    res.json(word); // 返回单词详情

  } catch (err) {
    console.error('获取单词详情错误:', err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: '单词未找到 (无效ID)' });
    }
    res.status(500).send('服务器错误');
  }
});


// --- TODO: 添加新单词的路由 (可能需要管理员权限) ---
// router.post('/', adminAuthMiddleware, async (req, res) => { /* ... */ });


module.exports = router;