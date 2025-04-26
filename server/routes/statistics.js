const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const LearningRecord = require('../models/LearningRecord');
const User = require('../models/User');
const Word = require('../models/Word');
const mongoose = require('mongoose');
const dayjs = require('dayjs'); // 使用 dayjs 处理日期，比原生 Date 更方便
// 需要安装 dayjs: npm install dayjs 或 yarn add dayjs (在 server 目录)
const utc = require('dayjs/plugin/utc'); // 处理 UTC 时间
const timezone = require('dayjs/plugin/timezone'); // 处理时区
dayjs.extend(utc);
dayjs.extend(timezone);

router.get('/overview', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    // 增加一个 userId 有效性检查 (虽然 authMiddleware 应保证存在)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         console.error("无效的 userId:", userId);
         return res.status(400).json({ msg: '无效的用户ID' });
     }
     const userObjectId = new mongoose.Types.ObjectId(userId); // 只转换一次

    try {
        // --- 1. 统计总学习单词数 ---
        const learnedAggregate = await LearningRecord.aggregate([
            { $match: { user: userObjectId } }, // 使用转换后的 ObjectId
            { $group: { _id: '$word' } },
            { $count: 'totalLearnedCount' }
        ]);
        const totalLearnedCount = learnedAggregate.length > 0 ? learnedAggregate[0].totalLearnedCount : 0;

        // --- 2. 统计已掌握单词数 ---
        const masteredCount = await LearningRecord.countDocuments({ user: userObjectId, status: 'Mastered' });

        // --- 3. 统计总学习天数 ---
        const studyDaysAggregate = await LearningRecord.aggregate([
             // V--- 添加 $match 过滤无效日期 ---V
            { $match: { user: userObjectId, lastReviewedAt: { $ne: null, $type: "date" } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$lastReviewedAt" },
                        month: { $month: "$lastReviewedAt" },
                        day: { $dayOfMonth: "$lastReviewedAt" }
                    }
                }
            },
            { $count: 'totalStudyDays' }
        ]);
        const totalStudyDays = studyDaysAggregate.length > 0 ? studyDaysAggregate[0].totalStudyDays : 0;

        // --- 4. 计算总正确率 ---
        const accuracyAggregate = await LearningRecord.aggregate([
             // V--- 添加 $match 过滤无效计数字段 (如果可能存在) ---V
            { $match: {
                user: userObjectId,
                // 确保字段存在且为数字类型，如果担心有脏数据
                // totalCorrect: { $type: "number" },
                // totalIncorrect: { $type: "number" }
              }
            },
            {
                $group: {
                    _id: null,
                    totalCorrect: { $sum: '$totalCorrect' },
                    totalIncorrect: { $sum: '$totalIncorrect' }
                }
            }
        ]);

        let overallAccuracy = 0;
        if (accuracyAggregate.length > 0) {
            const { totalCorrect = 0, totalIncorrect = 0 } = accuracyAggregate[0];
            const totalAttempts = totalCorrect + totalIncorrect;
            if (totalAttempts > 0) {
                overallAccuracy = Math.round((totalCorrect / totalAttempts) * 100);
            }
        }

        // --- 5. 获取用户注册日期 (不变) ---
        const user = await User.findById(userObjectId).select('registerDate');
        const memberSince = user ? user.registerDate : null;

        // 构造响应对象 (不变)
        const overviewStats = { totalLearnedCount, masteredCount, totalStudyDays, overallAccuracy, memberSince };
        res.json(overviewStats);

    } catch (err) {
        // 这里会捕获上面 try 块中的错误
        console.error('获取学习概览错误:', err); // <--- 在后端日志中打印详细错误
        res.status(500).send('服务器错误'); // 仍然返回 500，但后端日志有信息
    }
});

// --- 获取按时间分组的学习进度 ---
// @route   GET api/statistics/progress_over_time
// @desc    获取指定时间段内每天的学习次数（或学习单词数等）
// @access  Private
router.get('/progress_over_time', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    // 获取时间段参数 (例如 '7d', '30d', 'all'), 默认为 7 天
    const period = req.query.period || '7d';
    let startDate;

    // 根据 period 计算开始日期
    // 使用 dayjs 处理日期和时区，假设服务器或数据库使用 UTC
    // 或者根据用户偏好设置时区，这里简化为 UTC
    const now = dayjs.utc(); // 当前 UTC 时间
    if (period === '7d') {
        startDate = now.subtract(7, 'day').startOf('day').toDate(); // 7天前 00:00:00 UTC
    } else if (period === '30d') {
        startDate = now.subtract(30, 'day').startOf('day').toDate(); // 30天前 00:00:00 UTC
    } else {
        // 'all' 或其他无效值，可以获取所有记录，或者设置一个很早的日期
        startDate = new Date(0); // 1970年1月1日
    }

    try {
        const progressData = await LearningRecord.aggregate([
            {
                // 匹配用户和时间范围
                $match: {
                    user: userObjectId,
                    lastReviewedAt: { $gte: startDate } // 大于等于开始日期
                }
            },
            {
                // 按日期分组 (YYYY-MM-DD 格式)，考虑时区，这里用 UTC
                $group: {
                    _id: {
                        // 使用 $dateToString 格式化日期为 YYYY-MM-DD (更可靠，需要 MongoDB 3.6+)
                         $dateToString: { format: "%Y-%m-%d", date: "$lastReviewedAt", timezone: "UTC" }
                        // 或者使用 $dateTrunc (MongoDB 5.0+)
                        // $dateTrunc: { date: "$lastReviewedAt", unit: "day", timezone: "UTC" }
                        // 或者使用旧版的 $project + $year/$month/$day (如之前概览统计所示，但 $dateToString 更好)
                    },
                    // 计算每天的复习次数 (简单计数)
                    reviewCount: { $sum: 1 },
                    // (可选) 统计每天认识/不认识的次数
                    // correctCount: { $sum: { $cond: [ { $eq: ['$status', 'Mastered'] }, 1, 0 ] } }, // 这个例子不太对，status 是结果
                    // 需要 LearningRecord 存储每次交互是 know 还是 dont_know
                }
            },
            {
                // 按日期排序
                $sort: { '_id': 1 } // _id 就是 YYYY-MM-DD 字符串，按字符串排序即可
            },
            {
                // 重命名 _id 为 date
                $project: {
                    _id: 0, // 不输出 _id
                    date: '$_id', // 将 _id 重命名为 date
                    reviewCount: 1 // 保留 reviewCount
                    // correctCount: 1 // 如果计算了其他指标
                }
            }
        ]);

        // TODO: (可选) 填充缺失的日期，使图表连续
        // ... 逻辑来生成 startDate 到 endDate 间所有日期，并合并查询结果 ...

        res.json(progressData); // 返回格式为 [{ date: 'YYYY-MM-DD', reviewCount: N }, ...]

    } catch (err) {
        console.error('获取学习进度错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取薄弱单词列表 ---
// @route   GET api/statistics/weak_words
// @desc    获取当前用户学习记录中错误率较高的单词列表
// @access  Private
router.get('/weak_words', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const minAttempts = 3; // 最少尝试次数要求 (来自需求文档 >= 3)
    const minErrorRate = 0.4; // 最低错误率要求 (来自需求文档 > 40%)
    const limit = 20; // 最多返回多少个薄弱词

    try {
        const weakWords = await LearningRecord.aggregate([
            {
                // 1. 匹配当前用户的学习记录
                $match: {
                    user: userObjectId,
                    // 可以选择排除已掌握的单词
                    // status: { $ne: 'Mastered' }
                }
            },
            {
                // 2. 计算总尝试次数和错误率
                $project: {
                    word: 1, // 保留 word ID 用于后续 $lookup
                    status: 1, // 保留状态
                    lastReviewedAt: 1, // 保留最后复习时间
                    totalAttempts: { $add: ['$totalCorrect', '$totalIncorrect'] },
                    errorRate: {
                        $cond: [
                            // 如果总尝试次数 > 0
                            { $gt: [{ $add: ['$totalCorrect', '$totalIncorrect'] }, 0] },
                            // 则计算错误率: totalIncorrect / totalAttempts
                            { $divide: ['$totalIncorrect', { $add: ['$totalCorrect', '$totalIncorrect'] }] },
                            // 否则错误率为 0
                            0
                        ]
                    }
                }
            },
            {
                // 3. 筛选出符合薄弱词标准的记录
                $match: {
                    totalAttempts: { $gte: minAttempts }, // 尝试次数 >= 3
                    errorRate: { $gt: minErrorRate }      // 错误率 > 40%
                }
            },
            {
                // 4. 按错误率降序排序 (最弱的在前)
                $sort: { errorRate: -1 }
            },
            {
                // 5. 限制返回数量
                $limit: limit
            },
            {
                // 6. 关联 words 集合获取单词详细信息
                $lookup: {
                    from: 'words', // 要关联的集合名称 (Mongoose 会自动转为小写复数)
                    localField: 'word', // LearningRecord 中的外键字段
                    foreignField: '_id', // Word 集合中的主键字段
                    as: 'wordDetails' // 输出的数组字段名
                }
            },
            {
                // 7. $lookup 返回的是数组，使用 $unwind 将其展开 (假设一个 word ID 只对应一个 word)
                // 如果 wordDetails 可能为空数组 (例如 Word 被删除了)，用 preserveNullAndEmptyArrays
                $unwind: {
                     path: "$wordDetails",
                     preserveNullAndEmptyArrays: true // 保留那些没有匹配到 word 的记录 (虽然理论上不该发生)
                 }
            },
            {
                 // 8. 整理最终输出格式
                 $project: {
                     _id: 0, // 不需要 LearningRecord 的 _id
                     word: { // 包含单词的详细信息
                        _id: '$wordDetails._id',
                        spelling: '$wordDetails.spelling',
                        meaning: '$wordDetails.meaning',
                        phonetic: '$wordDetails.phonetic'
                     },
                     status: 1,
                     errorRate: 1, // 错误率
                     totalAttempts: 1, // 总尝试次数
                     lastReviewedAt: 1
                 }
             }

        ]);

        res.json(weakWords); // 返回格式为 [{ word: { spelling: ..., meaning: ... }, errorRate: N, ... }, ...]

    } catch (err) {
        console.error('获取薄弱单词列表错误:', err.message);
        res.status(500).send('服务器错误');
    }
});
// --- (其他路由和 module.exports) ---
module.exports = router;