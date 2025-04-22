const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // 认证中间件
const LearningRecord = require('../models/LearningRecord'); // 学习记录模型
const mongoose = require('mongoose'); // 用于验证 ObjectId

// @route   POST api/learning/record
// @desc    记录用户对单词的学习交互 (认识/不认识)
// @access  Private
router.post('/record', authMiddleware, async (req, res) => {
  const { wordId, action } = req.body; // 获取单词 ID 和用户动作 ('know' 或 'dont_know')
  const userId = req.user.id;

  // 1. 验证输入
  if (!wordId || !action) {
    return res.status(400).json({ msg: '缺少 wordId 或 action 参数' });
  }
  if (!mongoose.Types.ObjectId.isValid(wordId)) {
    return res.status(400).json({ msg: '无效的单词 ID' });
  }
  if (!['know', 'dont_know'].includes(action)) {
    return res.status(400).json({ msg: '无效的 action 参数' });
  }

  try {
    // 2. 调用模型中的静态方法来处理交互逻辑
    const updatedRecord = await LearningRecord.recordInteraction({ userId, wordId, action });

    res.json({ msg: '学习记录已更新', record: updatedRecord }); // 返回成功消息和更新后的记录

  } catch (err) {
    console.error('记录学习交互错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// TODO: 后续可以添加获取待复习单词列表的路由 GET /api/learning/review

module.exports = router;