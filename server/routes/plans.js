const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const WordBook = require('../models/WordBook'); // 需要验证 WordBook 存在且属于用户
const mongoose = require('mongoose');

// --- 获取当前用户的学习计划 ---
// @route   GET api/plans/current
// @desc    获取当前激活的学习计划详情
// @access  Private
router.get('/current', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('learningPlan'); // 只选择 learningPlan 字段
        if (!user || !user.learningPlan) {
            // 可以认为没有计划，或者返回一个默认空计划结构
            return res.json({ plan: null }); // 返回 null 表示无计划
        }
        res.json({ plan: user.learningPlan }); // 返回计划对象
    } catch (err) {
        console.error("获取学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 创建或更新学习计划 ---
// @route   POST api/plans
// @desc    创建或更新用户的学习计划 (简化：只允许一个激活计划)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { targetWordbookId, dailyNewWordsTarget, dailyReviewWordsTarget, planEndDate } = req.body;
    const userId = req.user.id;

    // 1. 验证输入
    if (!targetWordbookId || !mongoose.Types.ObjectId.isValid(targetWordbookId)) {
        return res.status(400).json({ msg: '请提供有效的单词书 ID' });
    }
    const newTarget = parseInt(dailyNewWordsTarget, 10);
    const reviewTarget = parseInt(dailyReviewWordsTarget, 10);
    if (isNaN(newTarget) || newTarget < 0 || isNaN(reviewTarget) || reviewTarget < 0) {
        return res.status(400).json({ msg: '每日目标必须是非负数字' });
    }
     // 验证结束日期 (如果提供)
     let endDate = null;
     if (planEndDate) {
         endDate = new Date(planEndDate);
         if (isNaN(endDate.getTime()) || endDate < new Date()) { // 无效日期或早于今天
             return res.status(400).json({ msg: '请输入有效的未来结束日期' });
         }
     }


    try {
        // 2. 验证单词书是否存在且属于该用户
        const wordbook = await WordBook.findOne({ _id: targetWordbookId, owner: userId });
        if (!wordbook) {
            return res.status(404).json({ msg: '选择的单词书不存在或不属于您' });
        }

        // 3. 更新用户信息中的 learningPlan
        const planUpdate = {
            isActive: true,
            targetWordbook: targetWordbookId,
            dailyNewWordsTarget: newTarget,
            dailyReviewWordsTarget: reviewTarget,
            planEndDate: endDate, // 可以是 null
            lastUpdated: Date.now()
        };

        // 使用 findByIdAndUpdate 更新用户的 learningPlan
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { learningPlan: planUpdate } }, // 使用 $set 更新整个 learningPlan 对象
            { new: true, // 返回更新后的文档
              select: 'learningPlan' } // 只返回 learningPlan 字段
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: '用户未找到' });
        }

        res.json({ msg: '学习计划已更新', plan: updatedUser.learningPlan });

    } catch (err) {
        console.error("更新学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 停用学习计划 ---
// @route   DELETE api/plans/current
// @desc    将当前计划设为非激活状态
// @access  Private
router.delete('/current', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
             // 将 isActive 设为 false，并更新时间戳，不清空其他设置
            { $set: { 'learningPlan.isActive': false, 'learningPlan.lastUpdated': Date.now() } },
            { new: true, select: 'learningPlan' }
        );

        if (!updatedUser) {
             return res.status(404).json({ msg: '用户未找到' });
         }

        res.json({ msg: '学习计划已停用', plan: updatedUser.learningPlan });
    } catch (err) {
        console.error("停用学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});


module.exports = router;