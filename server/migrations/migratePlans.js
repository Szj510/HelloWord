const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

/**
 * 将旧的learningPlan结构迁移到新的plans数组结构
 */
const migratePlans = async () => {
    console.log('开始迁移学习计划...');
    try {
        const users = await User.find({ learningPlan: { $exists: true, $ne: null } });
        console.log(`找到 ${users.length} 个用户有旧格式的学习计划`);

        let migratedCount = 0;
        
        for (const user of users) {
            // 检查用户是否有旧的学习计划并且是有效的
            if (user.learningPlan && 
                user.learningPlan.targetWordbook && 
                mongoose.Types.ObjectId.isValid(user.learningPlan.targetWordbook)) {
                
                // 如果用户还没有plans数组，创建一个空数组
                if (!user.plans) {
                    user.plans = [];
                }
                
                // 检查plans数组中是否已经有相同targetWordbook的计划
                const existingPlanIndex = user.plans.findIndex(
                    plan => plan.targetWordbook && 
                    plan.targetWordbook.toString() === user.learningPlan.targetWordbook.toString()
                );

                // 如果已经存在相同的计划，不添加新计划
                if (existingPlanIndex !== -1) {
                    console.log(`用户 ${user.email} 已经有相同词书的计划，跳过迁移`);
                    continue;
                }

                // 创建新的计划对象
                const newPlan = {
                    _id: new mongoose.Types.ObjectId(),
                    isActive: user.learningPlan.isActive || false,
                    targetWordbook: user.learningPlan.targetWordbook,
                    dailyNewWordsTarget: user.learningPlan.dailyNewWordsTarget || 15,
                    dailyReviewWordsTarget: user.learningPlan.dailyReviewWordsTarget || 40,
                    planEndDate: user.learningPlan.planEndDate,
                    createdAt: user.learningPlan.lastUpdated || new Date(),
                    lastUpdated: user.learningPlan.lastUpdated || new Date()
                };

                // 如果有任何其他计划是激活的，但是我们要迁移的计划也是激活的
                if (newPlan.isActive) {
                    // 停用其他所有计划
                    user.plans = user.plans.map(plan => ({
                        ...plan,
                        isActive: false
                    }));
                }

                // 添加新计划到plans数组
                user.plans.push(newPlan);
                await user.save();
                migratedCount++;
                
                console.log(`成功为用户 ${user.email} 迁移学习计划`);
            }
        }

        console.log(`迁移完成，共处理 ${migratedCount} 个计划`);
    } catch (err) {
        console.error('迁移学习计划时出错:', err);
    } finally {
        mongoose.disconnect();
        console.log('数据库连接已关闭');
    }
};

// 执行迁移
migratePlans();