const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const WordBook = require('../models/WordBook'); // 需要验证 WordBook 存在且属于用户
const mongoose = require('mongoose');

// --- 获取当前用户的所有学习计划 ---
// @route   GET api/plans
// @desc    获取用户的所有学习计划
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('plans'); 
        if (!user) {
            return res.status(404).json({ msg: '用户不存在' });
        }
        
        // 如果用户没有plans字段或plans为空数组，返回空数组
        const plans = user.plans || [];
        
        res.json({ plans });
    } catch (err) {
        console.error("获取学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取当前用户的学习计划 ---
// @route   GET api/plans/current
// @desc    获取当前激活的学习计划详情
// @access  Private
router.get('/current', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('plans'); 
        if (!user || !user.plans || user.plans.length === 0) {
            // 可以认为没有计划，或者返回一个默认空计划结构
            return res.json({ plan: null }); // 返回 null 表示无计划
        }
        
        // 查找激活的计划
        const activePlan = user.plans.find(plan => plan.isActive);
        
        res.json({ plan: activePlan || null }); // 如果没有激活的计划则返回null
    } catch (err) {
        console.error("获取学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 创建或更新学习计划 ---
// @route   POST api/plans
// @desc    创建新的学习计划并激活它
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { 
        targetWordbookId, 
        dailyNewWordsTarget, 
        dailyReviewWordsTarget, 
        planEndDate,
        reminderEnabled,
        reminderTime
    } = req.body;
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
     
     // 验证提醒时间格式 (如果已启用)
     if (reminderEnabled && (!reminderTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime))) {
         return res.status(400).json({ msg: '请提供有效的提醒时间格式 (HH:MM)' });
     }

    try {
        // 2. 验证单词书是否存在且属于该用户
        const wordbook = await WordBook.findOne({ _id: targetWordbookId, owner: userId });
        if (!wordbook) {
            return res.status(404).json({ msg: '选择的单词书不存在或不属于您' });
        }

        // 3. 创建新的学习计划
        const newPlan = {
            _id: new mongoose.Types.ObjectId(),
            isActive: true,
            targetWordbook: targetWordbookId,
            dailyNewWordsTarget: newTarget,
            dailyReviewWordsTarget: reviewTarget,
            planEndDate: endDate, // 可以是 null
            reminderEnabled: reminderEnabled || false,
            reminderTime: reminderTime || '08:00',
            createdAt: new Date(),
            lastUpdated: new Date()
        };

        // 4. 获取用户当前的计划列表
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: '用户未找到' });
        }

        // 确保plans字段存在
        if (!user.plans) {
            user.plans = [];
        }

        // 5. 停用其他所有计划
        user.plans = user.plans.map(plan => ({
            ...plan,
            isActive: false
        }));

        // 6. 添加新计划并保存
        user.plans.push(newPlan);
        await user.save();

        res.json({ 
            msg: '学习计划已创建并激活', 
            plan: newPlan,
            plans: user.plans
        });

    } catch (err) {
        console.error("创建学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 激活特定学习计划 ---
// @route   PUT api/plans/:planId/activate
// @desc    激活指定ID的学习计划，停用其他计划
// @access  Private
router.put('/:planId/activate', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const planId = req.params.planId;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({ msg: '无效的计划ID' });
    }

    try {
        // 查找用户
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: '用户未找到' });
        }

        if (!user.plans || user.plans.length === 0) {
            return res.status(404).json({ msg: '未找到任何学习计划' });
        }

        // 查找计划
        const planIndex = user.plans.findIndex(plan => plan._id.toString() === planId);
        if (planIndex === -1) {
            return res.status(404).json({ msg: '指定的学习计划不存在' });
        }

        // 停用所有计划
        user.plans = user.plans.map(plan => ({
            ...plan,
            isActive: false
        }));

        // 激活指定的计划
        user.plans[planIndex].isActive = true;
        user.plans[planIndex].lastUpdated = new Date();

        await user.save();

        res.json({ 
            msg: '学习计划已激活', 
            plan: user.plans[planIndex],
            plans: user.plans
        });
    } catch (err) {
        console.error("激活学习计划错误:", err.message);
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
        // 查找用户
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: '用户未找到' });
        }

        if (!user.plans || user.plans.length === 0) {
            return res.status(400).json({ msg: '没有可停用的学习计划' });
        }

        // 找到当前激活的计划
        const activePlanIndex = user.plans.findIndex(plan => plan.isActive);
        if (activePlanIndex === -1) {
            return res.status(400).json({ msg: '没有正在进行的学习计划' });
        }

        // 停用计划
        user.plans[activePlanIndex].isActive = false;
        user.plans[activePlanIndex].lastUpdated = new Date();

        await user.save();

        res.json({ 
            msg: '学习计划已停用', 
            plan: user.plans[activePlanIndex],
            plans: user.plans
        });
    } catch (err) {
        console.error("停用学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 删除特定学习计划 ---
// @route   DELETE api/plans/:planId
// @desc    删除指定ID的学习计划
// @access  Private
router.delete('/:planId', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const planId = req.params.planId;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({ msg: '无效的计划ID' });
    }

    try {
        // 查找用户
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: '用户未找到' });
        }

        if (!user.plans || user.plans.length === 0) {
            return res.status(404).json({ msg: '未找到任何学习计划' });
        }

        // 查找要删除的计划
        const planIndex = user.plans.findIndex(plan => plan._id.toString() === planId);
        if (planIndex === -1) {
            return res.status(404).json({ msg: '指定的学习计划不存在' });
        }

        // 如果删除的是当前激活的计划，则提示用户
        if (user.plans[planIndex].isActive) {
            return res.status(400).json({ msg: '不能删除当前激活的计划，请先停用它' });
        }

        // 删除计划
        user.plans.splice(planIndex, 1);
        await user.save();

        res.json({ 
            msg: '学习计划已删除', 
            plans: user.plans
        });
    } catch (err) {
        console.error("删除学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

module.exports = router;