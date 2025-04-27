const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const LearningRecord = require('../models/LearningRecord');
const mongoose = require('mongoose');
const dayjs = require('dayjs'); 
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

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

// --- 获取待复习单词数量 ---
// @route   GET api/learning/due
// @desc    获取当前用户需要复习的单词数量
// @access  Private
router.get('/due', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = dayjs.utc().toDate(); // 获取当前 UTC 时间

    try {
        // 查询 nextReviewAt 小于等于当前时间，且状态不是 Mastered 的记录数量
        const dueCount = await LearningRecord.countDocuments({
            user: userObjectId,
            status: { $ne: 'Mastered' }, // 排除已掌握的
            nextReviewAt: { $lte: now } // 下次复习时间已到或已过
        });

        res.json({ dueReviewCount: dueCount });

    } catch (err) {
        console.error('获取待复习单词数量错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

module.exports = router;