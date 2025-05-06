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
// @desc    创建新的学习计划并激活它，如果提供了planId则更新对应计划
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const {
        planId,  // 新增：如果提供了planId，将更新而不是创建
        name, // 新增
        targetWordbookId,
        dailyNewWordsTarget,
        dailyReviewWordsTarget, // 字段名统一
        planEndDate,
        reminderEnabled,
        reminderTime,
        weeklyReportEnabled, // 新增
        reviewModes // 新增：复习模式设置
    } = req.body;
    const userId = req.user.id;

    // 1. 验证输入
    if (!targetWordbookId || !mongoose.Types.ObjectId.isValid(targetWordbookId)) {
        return res.status(400).json({ msg: '请提供有效的单词书 ID' });
    }
    const newTarget = parseInt(dailyNewWordsTarget, 10);
    const reviewTarget = parseInt(dailyReviewWordsTarget, 10); // 字段名统一
    if (isNaN(newTarget) || newTarget < 0 || isNaN(reviewTarget) || reviewTarget < 0) {
        return res.status(400).json({ msg: '每日目标必须是非负数字' });
    }
     // 验证结束日期 (如果提供)
     let endDate = null;
     if (planEndDate) {
         console.log("收到计划结束日期:", planEndDate, "类型:", typeof planEndDate);
         endDate = new Date(planEndDate);
         console.log("解析后的日期对象:", endDate);

         if (isNaN(endDate.getTime())) {
             console.log("日期解析失败，无效的日期格式");
             return res.status(400).json({ msg: '请输入有效的日期格式' });
         }

         const today = new Date();
         today.setHours(0, 0, 0, 0);

         if (endDate < today) {
             console.log("日期早于今天:", endDate, "今天:", today);
             return res.status(400).json({ msg: '请输入未来的结束日期' });
         }

         console.log("有效的计划结束日期:", endDate);
     } else {
         console.log("未提供计划结束日期");
         // 确保endDate是null而不是undefined
         endDate = null;
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

        // 3. 查找用户，只需查询该用户的plans字段
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: '用户未找到' });
        }

        // 确保plans字段存在
        if (!user.plans) {
            user.plans = [];
        }

        // 4. 检查是否为更新现有计划
        if (planId && mongoose.Types.ObjectId.isValid(planId)) {
            // 寻找要更新的计划
            const planIndex = user.plans.findIndex(plan => plan._id.toString() === planId);

            if (planIndex !== -1) {
                // 更新现有计划
                const wasActive = user.plans[planIndex].isActive;

                // 如果之前不是激活状态但现在要激活，则先停用其他所有计划
                if (!wasActive) {
                    user.plans = user.plans.map(plan => ({
                        ...plan,
                        isActive: false
                    }));
                }

                // 更新计划内容
                user.plans[planIndex] = {
                    ...user.plans[planIndex],
                    name: name || '学习计划', // 新增
                    targetWordbook: targetWordbookId,
                    dailyNewWordsTarget: newTarget,
                    dailyReviewWordsTarget: reviewTarget, // 字段名统一
                    planEndDate: endDate,
                    reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : false,
                    reminderTime: reminderTime || '08:00',
                    weeklyReportEnabled: weeklyReportEnabled !== undefined ? weeklyReportEnabled : false, // 新增
                    reviewModes: reviewModes || user.plans[planIndex].reviewModes || [
                        { id: 1, name: '模式一', enabled: true },
                        { id: 2, name: '模式二', enabled: false },
                        { id: 3, name: '模式三', enabled: true }
                    ],
                    isActive: true,
                    lastUpdated: new Date()
                };

                // 打印更新后的计划数据，用于调试
                console.log("更新后的计划数据:", {
                    planEndDate: user.plans[planIndex].planEndDate,
                    weeklyReportEnabled: user.plans[planIndex].weeklyReportEnabled
                });

                // 确保保留原有的progress字段
                if (!user.plans[planIndex].progress) {
                    user.plans[planIndex].progress = {
                        totalWords: 0,
                        wordsLearned: 0,
                        wordsReviewed: 0,
                        percentageComplete: 0
                    };
                }

                // 使用findOneAndUpdate来避免触发全文档验证
                await User.findOneAndUpdate(
                    { _id: userId },
                    { $set: { plans: user.plans } },
                    { runValidators: false }
                );

                return res.json({
                    msg: '学习计划已更新并激活',
                    plan: user.plans[planIndex],
                    plans: user.plans
                });
            }
            // 如果找不到要更新的计划，则继续创建新计划
        }

        // 5. 如果不是更新，则创建新的学习计划
        const newPlan = {
            _id: new mongoose.Types.ObjectId(),
            name: name || '学习计划', // 新增
            isActive: true,
            targetWordbook: targetWordbookId,
            dailyNewWordsTarget: newTarget,
            dailyReviewWordsTarget: reviewTarget, // 字段名统一
            planEndDate: endDate, // 可以是 null
            reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : false,
            reminderTime: reminderTime || '08:00',
            weeklyReportEnabled: weeklyReportEnabled !== undefined ? weeklyReportEnabled : false, // 新增
            reviewModes: reviewModes || [
                { id: 1, name: '模式一', enabled: true },
                { id: 2, name: '模式二', enabled: false },
                { id: 3, name: '模式三', enabled: true }
            ],
            progress: {
                totalWords: 0,
                wordsLearned: 0,
                wordsReviewed: 0,
                percentageComplete: 0
            },
            createdAt: new Date(),
            lastUpdated: new Date()
        };

        // 打印新计划数据，用于调试
        console.log("新创建的计划数据:", {
            planEndDate: newPlan.planEndDate,
            weeklyReportEnabled: newPlan.weeklyReportEnabled
        });

        // 6. 停用其他所有计划
        user.plans = user.plans.map(plan => ({
            ...plan,
            isActive: false
        }));

        // 7. 添加新计划
        user.plans.push(newPlan);

        // 使用findOneAndUpdate来避免触发全文档验证
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { plans: user.plans } },
            { runValidators: false }
        );

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

        // 使用findOneAndUpdate来避免触发全文档验证
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { plans: user.plans } },
            { runValidators: false }
        );

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

        // 使用findOneAndUpdate来避免触发全文档验证
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { plans: user.plans } },
            { runValidators: false }
        );

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

        // 使用findOneAndUpdate来避免触发全文档验证
        await User.findOneAndUpdate(
            { _id: userId },
            { $set: { plans: user.plans } },
            { runValidators: false }
        );

        res.json({
            msg: '学习计划已删除',
            plans: user.plans
        });
    } catch (err) {
        console.error("删除学习计划错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 记忆曲线设置相关接口 ---
// @route    GET api/plans/memory-curve
// @desc     获取用户的记忆曲线参数设置
// @access   Private
router.get('/memory-curve', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // 从用户记录中获取记忆曲线设置
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 如果用户没有设置过记忆曲线参数，则返回默认值
        const memoryCurve = user.memoryCurveSettings || {
            efFactor: 2.5,         // 默认难度因子
            intervalModifier: 1.0   // 默认间隔修正系数
        };

        return res.json(memoryCurve);
    } catch (err) {
        console.error('获取记忆曲线设置失败:', err);
        return res.status(500).send('服务器错误');
    }
});

// @route    POST api/plans/memory-curve
// @desc     保存用户的记忆曲线参数设置
// @access   Private
router.post('/memory-curve', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { efFactor, intervalModifier } = req.body;

        // 验证参数
        if (efFactor === undefined || intervalModifier === undefined) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 验证参数范围
        if (efFactor < 1.3 || efFactor > 3.0) {
            return res.status(400).json({ message: 'efFactor 必须在 1.3 到 3.0 之间' });
        }

        if (intervalModifier < 0.5 || intervalModifier > 2.0) {
            return res.status(400).json({ message: 'intervalModifier 必须在 0.5 到 2.0 之间' });
        }

        // 更新用户的记忆曲线设置
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'memoryCurveSettings.efFactor': efFactor,
                    'memoryCurveSettings.intervalModifier': intervalModifier
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: '用户不存在' });
        }

        return res.json(updatedUser.memoryCurveSettings);
    } catch (err) {
        console.error('保存记忆曲线设置失败:', err);
        return res.status(500).send('服务器错误');
    }
});

// @route   GET api/plans/memory-curve/algorithm
// @desc    获取记忆曲线算法说明
// @access  Private
router.get('/memory-curve/algorithm', authMiddleware, (req, res) => {
    try {
        const algorithmDescription = {
            name: "SuperMemo-2 Modified",
            description: "基于 SuperMemo-2 算法的修改版本，用于间隔重复学习。",
            parameters: [
                {
                    name: "难度因子 (EF)",
                    description: "控制间隔增长率，值越低，复习频率越高，值越高，间隔增长越快。",
                    defaultValue: 2.5,
                    range: "1.3 - 3.0"
                },
                {
                    name: "间隔修正系数",
                    description: "直接与计算出的复习间隔相乘，值越大，复习间隔越长。",
                    defaultValue: 1.0,
                    range: "0.5 - 2.0"
                }
            ],
            formula: "I(n+1) = I(n) * EF * intervalModifier",
            references: [
                "SuperMemo-2 Algorithm (P.A. Wozniak, 1990)",
                "Spaced Repetition and Learning Research"
            ]
        };

        return res.json(algorithmDescription);
    } catch (err) {
        console.error('获取算法说明失败:', err);
        return res.status(500).send('服务器错误');
    }
});

module.exports = router;