const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();

async function migrateLearningPlans() {
    console.log('开始迁移学习计划...');
    try {
        const users = await User.find({ learningPlan: { $exists: true, $ne: null } });
        console.log(`找到 ${users.length} 个用户有旧格式的学习计划`);

        let migratedCount = 0;

        for (const user of users) {
            if (user.learningPlan &&
                user.learningPlan.targetWordbook &&
                mongoose.Types.ObjectId.isValid(user.learningPlan.targetWordbook)) {

                if (!user.plans) {
                    user.plans = [];
                }

                const existingPlanIndex = user.plans.findIndex(
                    plan => plan.targetWordbook &&
                    plan.targetWordbook.toString() === user.learningPlan.targetWordbook.toString()
                );

                if (existingPlanIndex !== -1) {
                    console.log(`用户 ${user.email} 已经有相同词书的计划，跳过迁移`);
                    continue;
                }

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

                if (newPlan.isActive) {
                    user.plans = user.plans.map(plan => ({
                        ...plan,
                        isActive: false
                    }));
                }

                user.plans.push(newPlan);
                await user.save();
                migratedCount++;

                console.log(`成功为用户 ${user.email} 迁移学习计划`);
            }
        }

        console.log(`迁移完成，共处理 ${migratedCount} 个计划`);
    } catch (err) {
        console.error('迁移学习计划时出错:', err);
    }
}

async function migratePlans() {
    console.log('开始迁移计划字段...');
    try {
        const users = await User.find({ 'plans.dailyReviewTarget': { $exists: true } });
        console.log(`找到 ${users.length} 个用户需要迁移计划字段`);

        for (const user of users) {
            let updated = false;
            user.plans = user.plans.map(plan => {
                if (plan.dailyReviewTarget !== undefined) {
                    plan.dailyReviewWordsTarget = plan.dailyReviewTarget;
                    delete plan.dailyReviewTarget;
                    updated = true;
                }
                return plan;
            });
            if (updated) {
                await user.save();
                console.log(`用户 ${user._id} 的计划字段已迁移`);
            }
        }

        console.log('迁移完成');
    } catch (err) {
        console.error('迁移计划字段时出错:', err);
    }
}

async function main() {
    await connectDB();
    await migrateLearningPlans();
    await migratePlans();
    mongoose.disconnect();
    console.log('数据库连接已关闭');
}

main();