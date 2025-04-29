const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const LearningRecord = require('../models/LearningRecord');
const User = require('../models/User');
const Word = require('../models/Word');
const WordBook = require('../models/WordBook'); // 新增 WordBook 模型
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const weekOfYear = require('dayjs/plugin/weekOfYear'); // 用于计算周
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);

router.get('/overview', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    // 增加一个 userId 有效性检查 (虽然 authMiddleware 应保证存在)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
         console.error("无效的 userId:", userId);
         return res.status(400).json({ msg: '无效的用户ID' });
     }
     const userObjectId = new mongoose.Types.ObjectId(userId); // 只转换一次

    try {
        // --- 1. 统计总学习单词数（与单词书计算保持一致） ---
        // 计算有学习记录的单词数量，无论状态是什么
        const learnedAggregate = await LearningRecord.aggregate([
            { $match: { user: userObjectId } }, // 使用转换后的 ObjectId
            { $group: { _id: '$word' } },
            { $count: 'totalLearnedCount' }
        ]);
        const totalLearnedCount = learnedAggregate.length > 0 ? learnedAggregate[0].totalLearnedCount : 0;
        console.log(`用户 ${userId} 总已学单词数: ${totalLearnedCount}`);

        // --- 2. 统计已掌握单词数 ---
        // 修改: 不仅检查状态为'Mastered'，也包括熟悉度至少为3的记录，确保统计已掌握的单词
        const masteredCount = await LearningRecord.countDocuments({ 
            user: userObjectId, 
            $or: [
                { status: 'Mastered' },
                { familiarity: { $gte: 3 } } // 假设熟悉度3及以上视为已掌握
            ]
        });
        console.log(`用户 ${userId} 已掌握单词数: ${masteredCount}`);

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

        // --- 新增: 4. 统计用户的总单词量 ---
        // 获取用户所有的单词书
        const wordbooks = await WordBook.find({ owner: userObjectId }).select('_id');
        const wordbookIds = wordbooks.map(book => book._id);
        
        // 计算所有单词书中的单词总数
        const totalWordCount = await Word.countDocuments({ 
            $or: [
                { wordbooks: { $in: wordbookIds } }, // 在用户的单词书中
                { _id: { $in: await LearningRecord.distinct('word', { user: userObjectId }) } } // 或者用户学过的单词
            ]
        });

        // --- 5. 计算总正确率 ---
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

        // --- 6. 计算连续学习天数（当前学习连续性）---
        // 获取所有学习日期并按降序排列（最近日期在前）
        const studyDatesAggregate = await LearningRecord.aggregate([
            { $match: { user: userObjectId, lastReviewedAt: { $ne: null, $type: "date" } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$lastReviewedAt" },
                        month: { $month: "$lastReviewedAt" },
                        day: { $dayOfMonth: "$lastReviewedAt" }
                    },
                    date: { $first: "$lastReviewedAt" }
                }
            },
            { $sort: { date: -1 } }, // 降序排序，最近日期在前
            { $project: { 
                _id: 0,
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
            }}
        ]);

        // 将日期字符串转换成日期对象数组
        const studyDates = studyDatesAggregate.map(item => dayjs(item.date));
        
        // 计算当前连续学习天数
        let currentStreak = 0;
        const today = dayjs().startOf('day');
        const yesterday = today.subtract(1, 'day');
        
        // 检查今天是否学习了
        const studiedToday = studyDates.some(date => date.isSame(today, 'day'));
        
        // 如果今天学习了，从今天开始计算连续天数
        // 如果今天没学习，但昨天学习了，从昨天开始计算
        let checkDate = studiedToday ? today : yesterday;
        let keepCounting = studiedToday || studyDates.some(date => date.isSame(yesterday, 'day'));
        
        // 如果今天或昨天都没学习，连续天数为0
        if (keepCounting) {
            currentStreak = studiedToday ? 1 : 0; // 如果今天学习了，初始连续天数为1
            
            // 从昨天或前天开始，检查之前的每一天
            let dayToCheck = studiedToday ? yesterday : yesterday.subtract(1, 'day');
            
            while (keepCounting) {
                // 检查这一天是否有学习记录
                const studiedOnDay = studyDates.some(date => date.isSame(dayToCheck, 'day'));
                
                if (studiedOnDay) {
                    currentStreak++;
                    dayToCheck = dayToCheck.subtract(1, 'day');
                } else {
                    keepCounting = false;
                }
            }
        }

        // --- 7. 获取用户注册日期 (不变) ---
        const user = await User.findById(userObjectId).select('registerDate');
        const memberSince = user ? user.registerDate : null;

        // --- 8. 获取最近一周的学习建议 ---
        const suggestions = await generateRecentSuggestions(userObjectId);

        // 构造响应对象 - 统一命名规范
        const overviewStats = { 
            totalWordCount,
            totalLearnedCount, 
            masteredCount, 
            learningDays: totalStudyDays, // 改为前端期望的字段名
            overallAccuracy, 
            currentStreak,
            memberSince,
            suggestions
        };
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

// --- 获取学习报告数据 (支持多种时间范围) ---
// @route   GET api/statistics/report
// @desc    获取指定周期的学习报告摘要数据
// @access  Private
router.get('/report', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // 支持多种报告类型: weekly(上周), last7days(近7天), thisMonth(本月), allTime(全部)
    const reportType = req.query.type || 'last7days';
    
    // 更灵活的日期范围计算
    let startDate, endDate, periodTitle;
    const now = dayjs.utc();
    
    switch(reportType) {
        case 'weekly':
            // 上周数据
            const lastWeekEnd = now.startOf('week').subtract(1, 'day'); // 上周日
            startDate = lastWeekEnd.subtract(6, 'day').startOf('day'); // 上周一
            endDate = lastWeekEnd.endOf('day'); // 上周日结束
            periodTitle = '上周总结';
            break;
        case 'last7days':
            // 过去7天
            endDate = now.endOf('day'); // 今天结束
            startDate = now.subtract(6, 'day').startOf('day'); // 7天前
            periodTitle = '近7天';
            break;
        case 'thisMonth':
            // 本月数据 
            startDate = now.startOf('month');
            endDate = now.endOf('day');
            periodTitle = '本月汇总';
            break;
        case 'allTime':
            // 所有历史数据
            startDate = dayjs('2000-01-01'); // 很久以前的日期
            endDate = now.endOf('day');
            periodTitle = '全部记录';
            break;
        default:
            // 默认为近7天
            endDate = now.endOf('day');
            startDate = now.subtract(6, 'day').startOf('day');
            periodTitle = '近7天';
    }
    
    // 转换为Date对象
    const startDateObj = startDate.toDate();
    const endDateObj = endDate.toDate();
    
    console.log(`Generating ${periodTitle} report for user ${userId} from ${startDateObj} to ${endDateObj}`);

    try {
        // --- 在指定时间段内聚合数据 ---
        const periodAggregation = await LearningRecord.aggregate([
            {
                // 匹配用户和指定时间段的学习记录
                $match: {
                    user: userObjectId,
                    lastReviewedAt: { $gte: startDateObj, $lte: endDateObj }
                }
            },
            {
                // 分组统计
                $group: {
                    _id: null, // 聚合所有匹配的记录
                    totalReviews: { $sum: 1 }, // 总复习次数
                    totalCorrect: { $sum: '$totalCorrect' }, // 累加时间段内每次记录的总正确数
                    totalIncorrect: { $sum: '$totalIncorrect' },// 累加时间段内每次记录的总错误数
                    distinctWordsReviewed: { $addToSet: '$word' } // 添加到集合以统计不同单词
                }
            },
            {
                 $project: {
                     _id: 0,
                     totalReviews: 1,
                     // 计算时间段内的正确率
                     periodAccuracy: {
                         $cond: [
                            { $gt: [ { $add: ['$totalCorrect', '$totalIncorrect'] }, 0 ] },
                            { $round: [ { $multiply: [ { $divide: ['$totalCorrect', { $add: ['$totalCorrect', '$totalIncorrect'] }] }, 100 ] }, 1 ] },
                            0
                         ]
                     },
                     wordsReviewedCount: { $size: '$distinctWordsReviewed' }
                 }
             }
        ]);

        // --- 获取期间内新掌握的单词 ---
        // 查找状态变为 Mastered 且 updatedAt 在指定时间段内的记录
        const masteredRecordsInPeriod = await LearningRecord.find({
             user: userObjectId,
             $or: [
                { status: 'Mastered' },
                { familiarity: { $gte: 3 } } // 包括熟悉度达到掌握标准的记录
             ],
             updatedAt: { $gte: startDateObj, $lte: endDateObj } // 状态更新时间在时间段内
         }).countDocuments(); // 只获取数量

        // --- 获取薄弱词 (在指定时间段内复习过的单词中查找薄弱词) ---
        const weakWordsData = await LearningRecord.aggregate([
             // 先匹配指定用户和时间段内的记录
             { $match: { 
                user: userObjectId,
                lastReviewedAt: { $gte: startDateObj, $lte: endDateObj }
             }},
             // 计算总尝试次数和错误率
             { $project: { 
                word: 1, 
                totalAttempts: { $add: ['$totalCorrect', '$totalIncorrect'] }, 
                errorRate: { 
                    $cond: [ 
                        { $gt: [{ $add: ['$totalCorrect', '$totalIncorrect'] }, 0] }, 
                        { $divide: ['$totalIncorrect', { $add: ['$totalCorrect', '$totalIncorrect'] }] }, 
                        0 
                    ] 
                } 
             }},
             // 筛选有足够尝试次数且错误率较高的记录
             { $match: { totalAttempts: { $gte: 3 }, errorRate: { $gt: 0.4 } } },
             // 按错误率降序排序
             { $sort: { errorRate: -1 } },
             { $limit: 5 },
             // 关联单词详情
             { $lookup: { from: 'words', localField: 'word', foreignField: '_id', as: 'wordDetails' } },
             { $unwind: { path: "$wordDetails", preserveNullAndEmptyArrays: true } },
             { $project: { _id: 0, spelling: '$wordDetails.spelling', meaning: '$wordDetails.meaning', errorRate: 1 } }
         ]);

        // --- 构造报告数据 ---
        const reportData = {
            periodType: reportType,
            periodTitle: periodTitle,
            startDate: startDate.format('YYYY-MM-DD'), // 格式化的日期字符串
            endDate: endDate.format('YYYY-MM-DD'),
            summary: periodAggregation.length > 0 ? periodAggregation[0] : { totalReviews: 0, periodAccuracy: 0, wordsReviewedCount: 0 },
            masteredInPeriod: masteredRecordsInPeriod,
            topWeakWords: weakWordsData,
            suggestions: generateSuggestions(
                periodAggregation.length > 0 ? periodAggregation[0] : { totalReviews: 0, wordsReviewedCount: 0 }, 
                masteredRecordsInPeriod, 
                weakWordsData
            )
        };

        res.json(reportData);

    } catch (err) {
        console.error(`生成 ${reportType} 报告错误:`, err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取每周学习统计数据 ---
// @route   GET api/statistics/weekly_progress
// @desc    获取最近四周的学习数据
// @access  Private
router.get('/weekly_progress', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    try {
        const now = dayjs.utc();
        const weeks = [];
        
        // 获取最近四周的开始和结束日期
        for (let i = 0; i < 4; i++) {
            const weekEnd = now.subtract(i * 7, 'day').endOf('day');
            const weekStart = weekEnd.subtract(6, 'day').startOf('day');
            
            weeks.push({
                weekNumber: 4 - i, // 第几周（从最远的开始算）
                weekName: `第${4-i}周`,
                startDate: weekStart.toDate(),
                endDate: weekEnd.toDate()
            });
        }
        
        // 按周查询和聚合数据
        const weeklyData = [];
        
        for (const week of weeks) {
            // 查询该周内的学习记录
            const weekStats = await LearningRecord.aggregate([
                {
                    $match: {
                        user: userObjectId,
                        lastReviewedAt: { 
                            $gte: week.startDate,
                            $lte: week.endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 }, // 总复习次数
                        distinctWords: { $addToSet: '$word' }, // 不同的单词
                        correctCount: { $sum: '$totalCorrect' },
                        incorrectCount: { $sum: '$totalIncorrect' }
                    }
                }
            ]);
            
            // 查询该周内掌握的单词数量（状态变更为Mastered）
            const masteredCount = await LearningRecord.countDocuments({
                user: userObjectId,
                updatedAt: { $gte: week.startDate, $lte: week.endDate },
                $or: [
                    { status: 'Mastered' },
                    { familiarity: { $gte: 3 } }
                ]
            });
            
            // 整合数据
            weeklyData.push({
                week: week.weekName,
                weekNumber: week.weekNumber,
                learned: weekStats.length > 0 ? weekStats[0].distinctWords.length : 0,
                mastered: masteredCount,
                totalReviews: weekStats.length > 0 ? weekStats[0].totalReviews : 0,
                startDate: dayjs(week.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(week.endDate).format('YYYY-MM-DD')
            });
        }
        
        // 按周数排序（从第一周到第四周）
        weeklyData.sort((a, b) => a.weekNumber - b.weekNumber);
        
        res.json(weeklyData);
        
    } catch (err) {
        console.error('获取每周进度数据错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取单词学习状态分布 ---
// @route   GET api/statistics/word_distribution
// @desc    获取当前学习计划中单词的学习状态分布
// @access  Private
router.get('/word_distribution', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    try {
        // 1. 获取用户信息
        const user = await User.findById(userObjectId);
        
        if (!user) {
            console.log(`用户 ${userId} 不存在`);
            return res.json({
                masteredCount: 0,
                learningCount: 0,
                notLearnedCount: 0,
                totalCount: 0
            });
        }

        // 2. 尝试获取当前使用的单词书 ID
        let wordbookId = null;
        let useAllWordbooks = false; // 新增标志，指示是否使用所有单词书
        
        // 首先检查新版计划系统
        if (user.currentPlanId && user.plans && user.plans.length > 0) {
            // 在 plans 数组中查找与 currentPlanId 匹配的计划
            const currentPlan = user.plans.find(plan => 
                plan._id.toString() === user.currentPlanId.toString()
            );
            
            if (currentPlan && currentPlan.targetWordbook) {
                wordbookId = currentPlan.targetWordbook;
                console.log(`用户 ${userId} 使用新版计划系统，单词书ID: ${wordbookId}`);
            }
        }
        
        // 如果没找到，尝试使用旧版学习计划
        if (!wordbookId && user.learningPlan && user.learningPlan.isActive && user.learningPlan.targetWordbook) {
            wordbookId = user.learningPlan.targetWordbook;
            console.log(`用户 ${userId} 使用旧版学习计划，单词书ID: ${wordbookId}`);
        }
        
        // 如果没有活跃的学习计划，使用用户所有的单词书
        if (!wordbookId) {
            useAllWordbooks = true;
            console.log(`用户 ${userId} 没有活跃学习计划，将使用所有单词书`);
        }
        
        let totalWordsInPlan = 0;
        let wordIds = [];

        if (useAllWordbooks) {
            // 获取用户所有的单词书
            const userWordbooks = await WordBook.find({ owner: userObjectId });
            
            if (!userWordbooks || userWordbooks.length === 0) {
                console.log(`用户 ${userId} 没有任何单词书，尝试导入默认单词书`);
                
                // 引入初始化脚本
                const { importDefaultWordbooks } = require('../seed/initUserWordbooks');
                
                // 导入默认单词书
                await importDefaultWordbooks(userObjectId);
                
                // 重新获取单词书
                const newWordbooks = await WordBook.find({ owner: userObjectId });
                
                if (!newWordbooks || newWordbooks.length === 0) {
                    console.log(`用户 ${userId} 导入默认单词书失败，统计为0`);
                    return res.json({
                        masteredCount: 0,
                        learningCount: 0,
                        notLearnedCount: 3,  // 默认显示3个未学习单词
                        totalCount: 3
                    });
                }
                
                // 使用新导入的单词书，直接从单词书模型中获取words数组
                let allWordIds = [];
                for (const wordbook of newWordbooks) {
                    allWordIds = [...allWordIds, ...(wordbook.words || [])];
                }
                
                // 去重 - 同一个单词可能在多个单词书中出现
                wordIds = [...new Set(allWordIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
                totalWordsInPlan = wordIds.length;
                
                console.log(`成功为用户 ${userId} 导入默认单词书，共 ${totalWordsInPlan} 个单词`);
            } else {
                // 直接从单词书中获取所有单词ID - 修正点：从单词书的words字段获取
                let allWordIds = [];
                for (const wordbook of userWordbooks) {
                    allWordIds = [...allWordIds, ...(wordbook.words || [])];
                }
                
                // 去重 - 同一个单词可能在多个单词书中出现
                wordIds = [...new Set(allWordIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
                totalWordsInPlan = wordIds.length;
                console.log(`用户 ${userId} 的所有单词书中共有 ${totalWordsInPlan} 个单词`);
            }
        } else {
            // 使用特定单词书的逻辑 - 修正点：直接获取单词书对象并从其words字段获取单词ID
            const wordbook = await WordBook.findById(wordbookId);
            
            if (!wordbook) {
                console.log(`用户 ${userId} 的单词书(ID: ${wordbookId})未找到`);
                return res.json({
                    masteredCount: 0,
                    learningCount: 0,
                    notLearnedCount: 3,
                    totalCount: 3
                });
            }
            
            wordIds = wordbook.words || [];
            totalWordsInPlan = wordIds.length;
            console.log(`单词书(ID: ${wordbookId})中共有 ${totalWordsInPlan} 个单词`);
        }
        
        // 如果没有单词，返回默认的统计数据（避免均为0或33.3%的情况）
        if (totalWordsInPlan === 0) {
            console.log(`用户 ${userId} 单词书中没有单词，返回默认数据`);
            return res.json({
                masteredCount: 0,
                learningCount: 0,
                notLearnedCount: 3,  // 默认显示3个未学习单词
                totalCount: 3
            });
        }
        
        // 5. 查询用户对这些单词的学习记录
        const learningRecords = await LearningRecord.find({
            user: userObjectId,
            word: { $in: wordIds }
        });
        
        // 6. 创建映射表，记录每个单词的学习状态
        const wordStatusMap = new Map();
        
        learningRecords.forEach(record => {
            const wordId = record.word.toString();
            const isMastered = record.status === 'Mastered' || record.familiarity >= 3;
            
            // 如果这个单词已经在map中并且已掌握，或者这是第一次遇到这个单词
            if (!wordStatusMap.has(wordId) || isMastered) {
                wordStatusMap.set(wordId, isMastered ? 'mastered' : 'learning');
            }
        });
        
        // 7. 统计各状态单词数量
        const masteredCount = Array.from(wordStatusMap.values()).filter(status => status === 'mastered').length;
        const learningCount = wordStatusMap.size - masteredCount;
        
        // 8. 计算未学习的单词数量 = 总单词数 - 已学习单词数
        const notLearnedCount = totalWordsInPlan - wordStatusMap.size;
        
        console.log(`单词分布统计: 总计 ${totalWordsInPlan} 词, 已掌握 ${masteredCount} 词, 学习中 ${learningCount} 词, 未学习 ${notLearnedCount} 词`);
        
        // 如果所有计数都为0，提供默认值以避免饼图显示为均等3份
        if (masteredCount === 0 && learningCount === 0 && notLearnedCount === 0) {
            return res.json({
                masteredCount: 0,
                learningCount: 0,
                notLearnedCount: 3,  // 默认显示3个未学习单词
                totalCount: 3
            });
        }
        
        // 返回分布统计
        res.json({
            masteredCount,
            learningCount,
            notLearnedCount,
            totalCount: totalWordsInPlan
        });
        
    } catch (err) {
        console.error('获取单词分布数据错误:', err);
        // 出现错误时返回默认值，确保前端显示正常
        res.json({
            masteredCount: 0,
            learningCount: 0,
            notLearnedCount: 3,  // 默认显示3个未学习单词
            totalCount: 3
        });
    }
});

// 简单的建议生成函数 (示例)
function generateSuggestions(summary, masteredCount, weakWords) {
    const suggestions = [];
    const reviewCount = summary?.totalReviews || 0;
    const reviewedWords = summary?.wordsReviewedCount || 0;

    if (reviewCount < 50 && reviewedWords < 10) { // 假设每周目标是复习 50 次或 10 个不同单词
        suggestions.push("学习有点少哦，尝试每天坚持复习一会吧！");
    } else if (reviewCount > 300) {
        suggestions.push("你非常努力！继续保持，注意劳逸结合。");
    }

    if (masteredCount > 10) {
        suggestions.push(`上周新掌握了 ${masteredCount} 个单词，真棒！`);
    }

    if (weakWords && weakWords.length > 0) {
        suggestions.push(`注意到你在 ${weakWords.map(w => `"${w.spelling}"`).slice(0, 2).join(', ')} 等单词上遇到了困难，可以针对性地多复习一下。`);
    } else if (reviewCount > 0) {
         suggestions.push("上周没有发现明显的薄弱单词，继续加油！");
     }

    if (suggestions.length === 0) {
        suggestions.push("继续努力，保持学习节奏！");
    }

    return suggestions;
}

// 生成用户最近学习建议
async function generateRecentSuggestions(userObjectId) {
    // 获取最近7天的时间范围
    const now = dayjs.utc();
    const endDate = now.endOf('day').toDate();
    const startDate = now.subtract(6, 'day').startOf('day').toDate();
    
    try {
        // 获取近7天的学习统计
        const recentStats = await LearningRecord.aggregate([
            { 
                $match: { 
                    user: userObjectId,
                    lastReviewedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    totalCorrect: { $sum: '$totalCorrect' },
                    totalIncorrect: { $sum: '$totalIncorrect' },
                    distinctWords: { $addToSet: '$word' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalReviews: 1,
                    accuracy: {
                        $cond: [
                            { $gt: [ { $add: ['$totalCorrect', '$totalIncorrect'] }, 0 ] },
                            { $round: [ { $multiply: [ { $divide: ['$totalCorrect', { $add: ['$totalCorrect', '$totalIncorrect'] }] }, 100 ] }, 1 ] },
                            0
                        ]
                    },
                    distinctWordCount: { $size: '$distinctWords' }
                }
            }
        ]);
        
        // 获取连续学习天数
        const studyDatesAggregate = await LearningRecord.aggregate([
            { $match: { user: userObjectId, lastReviewedAt: { $ne: null, $type: "date" } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$lastReviewedAt" },
                        month: { $month: "$lastReviewedAt" },
                        day: { $dayOfMonth: "$lastReviewedAt" }
                    },
                    date: { $first: "$lastReviewedAt" }
                }
            },
            { $sort: { date: -1 } },
            { $project: { 
                _id: 0,
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
            }}
        ]);
        
        // 计算连续学习天数
        let currentStreak = 0;
        if (studyDatesAggregate.length > 0) {
            const studyDates = studyDatesAggregate.map(item => dayjs(item.date));
            const today = dayjs().startOf('day');
            const yesterday = today.subtract(1, 'day');
            
            const studiedToday = studyDates.some(date => date.isSame(today, 'day'));
            const studiedYesterday = studyDates.some(date => date.isSame(yesterday, 'day'));
            
            if (studiedToday || studiedYesterday) {
                currentStreak = studiedToday ? 1 : 0;
                let dayToCheck = studiedToday ? yesterday : yesterday.subtract(1, 'day');
                let keepChecking = true;
                
                while (keepChecking) {
                    const studiedOnDay = studyDates.some(date => date.isSame(dayToCheck, 'day'));
                    if (studiedOnDay) {
                        currentStreak++;
                        dayToCheck = dayToCheck.subtract(1, 'day');
                    } else {
                        keepChecking = false;
                    }
                }
            }
        }
        
        // 获取薄弱单词
        const weakWords = await LearningRecord.aggregate([
            { $match: { user: userObjectId } },
            {
                $project: {
                    word: 1,
                    totalAttempts: { $add: ['$totalCorrect', '$totalIncorrect'] },
                    errorRate: {
                        $cond: [
                            { $gt: [{ $add: ['$totalCorrect', '$totalIncorrect'] }, 0] },
                            { $divide: ['$totalIncorrect', { $add: ['$totalCorrect', '$totalIncorrect'] }] },
                            0
                        ]
                    }
                }
            },
            { $match: { totalAttempts: { $gte: 3 }, errorRate: { $gt: 0.4 } } },
            { $sort: { errorRate: -1 } },
            { $limit: 3 },
            { $lookup: { from: 'words', localField: 'word', foreignField: '_id', as: 'wordDetails' } },
            { $unwind: { path: "$wordDetails" } },
            { $project: { spelling: '$wordDetails.spelling', errorRate: 1 } }
        ]);
        
        // 生成个性化建议
        const suggestions = [];
        const stats = recentStats.length > 0 ? recentStats[0] : { totalReviews: 0, accuracy: 0, distinctWordCount: 0 };
        
        // 学习频率建议
        if (stats.totalReviews === 0) {
            suggestions.push("你已经有一段时间没有学习了，现在是恢复学习的好时机！");
        } else if (stats.totalReviews < 20) {
            suggestions.push("增加学习频率可以帮助你更快掌握单词，建议每天至少学习10个单词。");
        } else if (stats.totalReviews > 200) {
            suggestions.push("你最近学习非常勤奋，记得适当休息，避免疲劳学习。");
        }
        
        // 学习准确率建议
        if (stats.accuracy < 60 && stats.totalReviews > 10) {
            suggestions.push("你的学习准确率有提升空间，可以尝试减慢学习速度，更专注于每个单词。");
        } else if (stats.accuracy > 90 && stats.totalReviews > 20) {
            suggestions.push("你的学习准确率很高，可以考虑增加每天学习的新单词数量。");
        }
        
        // 连续学习建议
        if (currentStreak > 7) {
            suggestions.push(`你已经连续学习了${currentStreak}天，这是非常棒的习惯，继续保持！`);
        } else if (currentStreak > 0) {
            suggestions.push(`你已经连续学习了${currentStreak}天，坚持每天学习可以显著提高记忆效果。`);
        } else {
            suggestions.push("每天学习一点点比一次学习很多更有效，尝试建立每日学习习惯。");
        }
        
        // 薄弱词建议
        if (weakWords && weakWords.length > 0) {
            const wordList = weakWords.map(w => w.spelling).join('、');
            suggestions.push(`建议重点复习这些单词：${wordList}，它们是你的薄弱词。`);
        }
        
        // 如果没有足够的个性化建议，添加通用建议
        if (suggestions.length < 2) {
            suggestions.push("使用记忆技巧如联想法、故事法可以帮助你更好地记住单词。");
            suggestions.push("尝试在不同场景中使用新学的单词，这样能加深记忆。");
        }
        
        return suggestions;
    } catch (err) {
        console.error('生成学习建议时出错:', err);
        return ["继续保持学习，形成良好的学习习惯。"];
    }
}

// --- (其他路由和 module.exports) ---
module.exports = router;