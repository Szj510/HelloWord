const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // 引入认证中间件
const WordBook = require('../models/WordBook'); // 引入 WordBook 模型
const Word = require('../models/Word'); // 引入 Word 模型
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
    const wordbooks = await WordBook.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json(wordbooks);
  } catch (err) {
    console.error('获取单词书列表错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// --- 获取特定单词书的详情 ---
// @route   GET api/wordbooks/:id
// @desc    获取指定 ID 的单词书详情 (包含单词列表)
// @access  Private (需要验证所有权)
router.get('/:id', authMiddleware, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: '无效的单词书 ID' });
  }

  try {
    const wordbook = await WordBook.findById(req.params.id)
                                    .populate('words', 'spelling phonetic meaning difficulty'); // 填充单词信息

    if (!wordbook) {
      return res.status(404).json({ msg: '单词书未找到' });
    }

    // 检查所有权
    if (wordbook.owner.toString() !== req.user.id) {
       return res.status(403).json({ msg: '无权访问此单词书' });
    }

    res.json(wordbook);
  } catch (err) {
    console.error('获取单词书详情错误:', err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: '单词书未找到 (无效ID)' });
    }
    res.status(500).send('服务器错误');
  }
});

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

// --- TODO: 后续添加更新、删除、删除单词的路由 ---
// router.put('/:id', authMiddleware, async (req, res) => { /* 更新逻辑 */ });
// router.delete('/:id', authMiddleware, async (req, res) => { /* 删除逻辑 */ });
// router.delete('/:id/words/:wordId', authMiddleware, async (req, res) => { /* 删除单词逻辑 */ });

module.exports = router; // 确保导出了 router