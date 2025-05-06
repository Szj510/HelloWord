const cron = require('node-cron');
const User = require('../models/User');
const LearningRecord = require('../models/LearningRecord');
const emailSender = require('./emailSender');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// 扩展dayjs功能
dayjs.extend(utc);
dayjs.extend(timezone);

// 保存所有活动的提醒任务
const activeTasks = new Map();

/**
 * 初始化所有用户的学习提醒
 */
async function initializeAllReminders() {
    try {
        console.log('正在初始化所有用户的学习提醒...');
        
        // 清除所有现有任务
        clearAllTasks();
        
        // 获取所有启用提醒的用户
        const users = await User.find({
            'learningPreferences.dailyReminderEnabled': true
        }).select('_id username email learningPreferences plans');
        
        // 为每个用户创建提醒任务
        for (const user of users) {
            // 设置全局提醒
            if (user.learningPreferences.dailyReminderEnabled) {
                scheduleUserReminder(user);
            }
            
            // 设置每个计划的单独提醒
            if (user.plans && user.plans.length > 0) {
                user.plans.forEach(plan => {
                    if (plan.isActive && plan.reminderEnabled) {
                        schedulePlanReminder(user, plan);
                    }
                });
            }
        }

        // 设置周报发送任务 - 每周日晚上8点发送
        scheduleWeeklyReports();
        
        console.log(`已成功为${activeTasks.size}个提醒任务设置调度`);
    } catch (err) {
        console.error('初始化提醒任务失败:', err);
    }
}

/**
 * 为特定用户设置学习提醒
 * @param {Object} user 用户对象
 */
function scheduleUserReminder(user) {
    try {
        const reminderTime = user.learningPreferences.reminderTime || '08:00';
        const [hours, minutes] = reminderTime.split(':');
        
        // 为不同的提醒类型设置不同的ID，避免重复
        const taskId = `global_reminder_${user._id.toString()}`;
        
        // 设置cron表达式 - 每天在指定时间执行
        const cronExpression = `${minutes} ${hours} * * *`;
        
        // 删除之前的任务（如果存在）
        if (activeTasks.has(taskId)) {
            activeTasks.get(taskId).stop();
            activeTasks.delete(taskId);
        }
        
        // 创建新的定时任务
        const task = cron.schedule(cronExpression, async () => {
            try {
                await sendDailyReminder(user);
            } catch (err) {
                console.error(`发送提醒邮件给用户${user.username}失败:`, err);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Shanghai" // 可以根据用户配置设置时区
        });
        
        // 存储任务引用
        activeTasks.set(taskId, task);
        
        console.log(`为用户${user.username}设置了每日学习提醒: ${reminderTime}`);
    } catch (err) {
        console.error(`为用户${user.username}设置提醒任务失败:`, err);
    }
}

/**
 * 设置每周报告发送任务
 * 默认安排在每周日晚上8点发送周报
 */
function scheduleWeeklyReports() {
    const taskId = 'weekly_reports';
    
    // 删除之前的任务（如果存在）
    if (activeTasks.has(taskId)) {
        activeTasks.get(taskId).stop();
        activeTasks.delete(taskId);
    }
    
    // 创建新的定时任务 - 每周日(0) 20:00 发送
    const cronExpression = '0 20 * * 0';
    
    const task = cron.schedule(cronExpression, async () => {
        try {
            await sendWeeklyReportsToAllUsers();
            console.log('已触发每周学习报告发送');
        } catch (err) {
            console.error('发送周报任务执行失败:', err);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Shanghai"
    });
    
    // 存储任务引用
    activeTasks.set(taskId, task);
    console.log(`已设置每周报告发送任务: 每周日晚8点`);
}

/**
 * 向所有符合条件的用户发送周报
 */
async function sendWeeklyReportsToAllUsers() {
    try {
        // 获取所有启用了周报的用户
        const users = await User.find({
            'learningPreferences.weeklyReportEnabled': true
        }).select('_id username email');
        
        console.log(`找到${users.length}个启用周报功能的用户`);
        
        // 为每个用户生成并发送周报
        let successCount = 0;
        for (const user of users) {
            try {
                const weeklyStats = await generateUserWeeklyStats(user._id);
                
                // 只为有学习记录的用户发送周报
                if (weeklyStats.totalReviews > 0 || weeklyStats.newWordsLearned > 0) {
                    await emailSender.sendWeeklyReportEmail(
                        user.email,
                        user.username,
                        weeklyStats
                    );
                    successCount++;
                    console.log(`已发送周报给用户: ${user.username}`);
                } else {
                    console.log(`用户 ${user.username} 本周没有学习记录，跳过发送周报`);
                }
            } catch (err) {
                console.error(`为用户 ${user.username} 发送周报失败:`, err);
            }
        }
        
        console.log(`周报发送完成: ${successCount}/${users.length}个用户成功接收`);
        
    } catch (err) {
        console.error('发送周报过程中发生错误:', err);
        throw err;
    }
}

/**
 * 为特定用户生成周报数据
 * @param {mongoose.Types.ObjectId|string} userId 用户ID
 * @returns {Promise<Object>} 周报数据
 */
async function generateUserWeeklyStats(userId) {
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    
    // 定义上周的时间范围
    const now = dayjs();
    const endDate = now.startOf('day').toDate(); // 今天开始
    const startDate = now.subtract(7, 'day').startOf('day').toDate(); // 7天前
    
    try {
        // 获取时间段内的学习记录
        const weeklyRecords = await LearningRecord.find({
            user: userObjectId,
            lastReviewedAt: { $gte: startDate, $lte: endDate }
        });
        
        // 计算不同日期的学习记录，用于统计学习天数
        const studyDays = new Set();
        let newWordsLearned = 0;
        let wordsReviewed = 0;
        const reviewedWordIds = new Set();
        
        for (const record of weeklyRecords) {
            const dateStr = record.lastReviewedAt.toISOString().split('T')[0];
            studyDays.add(dateStr);
            
            // 判断是新学习的单词还是复习的单词
            if (record.firstLearnedAt && record.firstLearnedAt >= startDate && record.firstLearnedAt <= endDate) {
                newWordsLearned++;
            }
            
            // 统计复习单词数量（去重）
            reviewedWordIds.add(record.word.toString());
            wordsReviewed++;
        }
        
        // 构建周报数据
        return {
            period: `${dayjs(startDate).format('YYYY-MM-DD')} 至 ${dayjs(endDate).format('YYYY-MM-DD')}`,
            daysLearned: studyDays.size,
            newWordsLearned,
            wordsReviewed: reviewedWordIds.size,
            totalReviews: wordsReviewed, // 总复习次数
            // 可以添加更多相关统计数据
        };
        
    } catch (err) {
        console.error(`为用户 ${userId} 生成周报数据失败:`, err);
        // 返回默认数据以避免完全失败
        return {
            period: `${dayjs(startDate).format('YYYY-MM-DD')} 至 ${dayjs(endDate).format('YYYY-MM-DD')}`,
            daysLearned: 0,
            newWordsLearned: 0,
            wordsReviewed: 0,
            totalReviews: 0
        };
    }
}

/**
 * 为用户的特定学习计划设置提醒
 * @param {Object} user 用户对象
 * @param {Object} plan 学习计划对象
 */
function schedulePlanReminder(user, plan) {
    try {
        // 如果计划没有启用提醒，则不设置
        if (!plan.reminderEnabled) return;
        
        const reminderTime = plan.reminderTime || '08:00';
        const [hours, minutes] = reminderTime.split(':');
        
        // 为不同的计划设置不同的ID
        const taskId = `plan_reminder_${user._id.toString()}_${plan._id.toString()}`;
        
        // 设置cron表达式 - 每天在指定时间执行
        const cronExpression = `${minutes} ${hours} * * *`;
        
        // 删除之前的任务（如果存在）
        if (activeTasks.has(taskId)) {
            activeTasks.get(taskId).stop();
            activeTasks.delete(taskId);
        }
        
        // 创建新的定时任务
        const task = cron.schedule(cronExpression, async () => {
            try {
                await sendPlanReminder(user, plan);
            } catch (err) {
                console.error(`发送计划提醒邮件给用户${user.username}失败:`, err);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Shanghai" // 可以根据用户配置设置时区
        });
        
        // 存储任务引用
        activeTasks.set(taskId, task);
        
        console.log(`为用户${user.username}的学习计划"${plan.name}"设置了提醒: ${reminderTime}`);
    } catch (err) {
        console.error(`为用户${user.username}的计划设置提醒任务失败:`, err);
    }
}

/**
 * 发送每日学习提醒邮件
 * @param {Object} user 用户对象
 */
async function sendDailyReminder(user) {
    try {
        // 获取最新的用户数据
        const freshUser = await User.findById(user._id).select('username email stats plans');
        
        if (!freshUser) {
            console.warn(`用户${user._id}不存在，无法发送提醒`);
            return;
        }
        
        // 获取学习统计数据
        const stats = freshUser.stats || {};
        const streak = stats.streak || 0;
        
        // 构造邮件内容
        const subject = `${freshUser.username}，今天的单词学习等待你！`;
        
        let streakMessage = '';
        if (streak > 0) {
            streakMessage = `<p>你已经连续学习了 <strong>${streak}天</strong>，继续保持！</p>`;
        }
        
        // 获取用户当前激活的学习计划
        const activePlan = freshUser.plans && freshUser.plans.find(p => p.isActive);
        let planMessage = '';
        
        if (activePlan) {
            const progress = activePlan.progress || {};
            const percentComplete = progress.percentageComplete || 0;
            
            planMessage = `
                <div style="margin: 20px 0; padding: 15px; background-color: #f7f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #4b6584;">当前学习计划: ${activePlan.name}</h3>
                    <p>进度: ${percentComplete.toFixed(1)}% 已完成</p>
                    <p>今日目标: ${activePlan.dailyNewWordsTarget} 个新单词, ${activePlan.dailyReviewTarget} 个复习单词</p>
                </div>
            `;
        }
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2>你好，${freshUser.username}！</h2>
                <p>是时候继续你的单词学习之旅了！</p>
                ${streakMessage}
                ${planMessage}
                <div style="margin: 25px 0;">
                    <a href="https://your-app-url.com/learning" style="background-color: #a67c52; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        立即开始学习
                    </a>
                </div>
                <p>每天坚持学习，词汇量将稳步提升！</p>
                <p>祝学习愉快！<br>Hello Word 团队</p>
                <p style="font-size: 12px; color: #999; margin-top: 30px;">
                    如果你不想再收到这些提醒，可以在<a href="https://your-app-url.com/settings" style="color: #a67c52;">设置</a>中关闭提醒。
                </p>
            </div>
        `;
        
        // 发送邮件
        await emailSender.sendHtmlEmail(freshUser.email, subject, html);
        console.log(`已向用户 ${freshUser.username} 发送每日学习提醒`);
        
    } catch (err) {
        console.error('发送每日提醒失败:', err);
        throw err;
    }
}

/**
 * 发送特定学习计划的提醒邮件
 * @param {Object} user 用户对象
 * @param {Object} plan 学习计划对象
 */
async function sendPlanReminder(user, plan) {
    try {
        // 获取最新的用户数据和计划数据
        const freshUser = await User.findById(user._id).select('username email');
        if (!freshUser) {
            console.warn(`用户${user._id}不存在，无法发送计划提醒`);
            return;
        }
        
        // 查找最新的计划数据
        const freshPlan = await User.findOne(
            { _id: user._id, 'plans._id': plan._id },
            { 'plans.$': 1 }
        );
        
        if (!freshPlan || !freshPlan.plans || freshPlan.plans.length === 0) {
            console.warn(`计划${plan._id}不存在，无法发送提醒`);
            return;
        }
        
        const currentPlan = freshPlan.plans[0];
        
        // 构造邮件内容
        const subject = `${freshUser.username}，"${currentPlan.name}"学习计划提醒`;
        
        const progress = currentPlan.progress || {};
        const percentComplete = progress.percentageComplete || 0;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2>你好，${freshUser.username}！</h2>
                <p>这是你的"${currentPlan.name}"学习计划提醒。</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f7f9fa; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #4b6584;">学习计划详情</h3>
                    <p>进度: ${percentComplete.toFixed(1)}% 已完成</p>
                    <p>今日目标: ${currentPlan.dailyNewWordsTarget} 个新单词, ${currentPlan.dailyReviewTarget} 个复习单词</p>
                </div>
                
                <div style="margin: 25px 0;">
                    <a href="https://your-app-url.com/learning?plan=${currentPlan._id}" 
                       style="background-color: #a67c52; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        继续学习此计划
                    </a>
                </div>
                
                <p>坚持按计划学习，将帮助你更快地掌握词汇！</p>
                <p>祝学习顺利！<br>Hello Word 团队</p>
                
                <p style="font-size: 12px; color: #999; margin-top: 30px;">
                    如果你不想再收到这个计划的提醒，可以在<a href="https://your-app-url.com/plans/${currentPlan._id}/settings" style="color: #a67c52;">计划设置</a>中关闭提醒。
                </p>
            </div>
        `;
        
        // 发送邮件
        await emailSender.sendHtmlEmail(freshUser.email, subject, html);
        console.log(`已向用户 ${freshUser.username} 发送"${currentPlan.name}"学习计划提醒`);
        
    } catch (err) {
        console.error('发送计划提醒失败:', err);
        throw err;
    }
}

/**
 * 更新用户的提醒设置
 * @param {String} userId 用户ID
 */
async function updateUserReminders(userId) {
    try {
        // 获取用户数据
        const user = await User.findById(userId).select('username email learningPreferences plans');
        
        if (!user) {
            console.warn(`用户${userId}不存在，无法更新提醒`);
            return;
        }
        
        // 删除该用户的所有提醒任务
        clearUserTasks(userId);
        
        // 设置全局提醒
        if (user.learningPreferences.dailyReminderEnabled) {
            scheduleUserReminder(user);
        }
        
        // 设置每个计划的单独提醒
        if (user.plans && user.plans.length > 0) {
            user.plans.forEach(plan => {
                if (plan.isActive && plan.reminderEnabled) {
                    schedulePlanReminder(user, plan);
                }
            });
        }
        
        console.log(`已更新用户${user.username}的提醒设置`);
    } catch (err) {
        console.error(`更新用户${userId}的提醒设置失败:`, err);
        throw err;
    }
}

/**
 * 清除指定用户的所有提醒任务
 * @param {String} userId 用户ID
 */
function clearUserTasks(userId) {
    // 清除全局提醒
    const globalTaskId = `global_reminder_${userId}`;
    if (activeTasks.has(globalTaskId)) {
        activeTasks.get(globalTaskId).stop();
        activeTasks.delete(globalTaskId);
    }
    
    // 清除计划提醒
    // 由于我们不知道计划ID，需要遍历所有任务
    const planPrefix = `plan_reminder_${userId}_`;
    for (const [taskId, task] of activeTasks.entries()) {
        if (taskId.startsWith(planPrefix)) {
            task.stop();
            activeTasks.delete(taskId);
        }
    }
}

/**
 * 清除所有提醒任务
 */
function clearAllTasks() {
    for (const task of activeTasks.values()) {
        task.stop();
    }
    activeTasks.clear();
    console.log('已清除所有提醒任务');
}

module.exports = {
    initializeAllReminders,
    scheduleUserReminder,
    schedulePlanReminder,
    updateUserReminders,
    clearUserTasks,
    clearAllTasks,
    scheduleWeeklyReports,
    sendWeeklyReportsToAllUsers,
    generateUserWeeklyStats
};