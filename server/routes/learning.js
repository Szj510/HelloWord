const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const LearningRecord = require('../models/LearningRecord');
const WordBook = require('../models/WordBook'); 
const Word = require('../models/Word');
const User = require('../models/User');      
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
        // 1. 获取用户的学习计划
        const user = await User.findById(userId).select('learningPlan').lean();
        const plan = user?.learningPlan;
        let dailyReviewLimit = 30; // 默认值

        if (plan && plan.isActive) {
            dailyReviewLimit = plan.dailyReviewWordsTarget || dailyReviewLimit;
        }

        // 2. 查询需要复习的单词数量 - 确保正确计数
        const dueCount = await LearningRecord.countDocuments({
            user: userObjectId,
            status: { $ne: 'Mastered' }, // 排除已掌握的
            nextReviewAt: { $lte: now } // 下次复习时间已到或已过
        });
        
        console.log(`用户 ${userId} 待复习单词数量: ${dueCount}`);
        
        // 返回实际待复习数量，但不超过用户每日复习限制
        const limitedDueCount = Math.min(dueCount, dailyReviewLimit);
        
        res.json({ 
            dueReviewCount: limitedDueCount,
            totalDueCount: dueCount,
            dailyLimit: dailyReviewLimit
        });

    } catch (err) {
        console.error('获取待复习单词数量错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取新的学习会话单词列表 ---
// @route   GET api/learning/session
// @desc    获取一个包含待复习和新单词的学习会话列表
// @access  Private
router.get('/session', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { wordbookId } = req.query; // 从查询参数获取要学习的单词书 ID
    const sessionMode = req.query.mode || 'mixed'; // 默认混合模式：'mixed', 'review', 'new'

    console.log(`请求的学习会话模式: ${sessionMode}`); // 增加日志，记录请求的模式

    // 初始化默认限制
    let reviewLimit = 0;
    let newLimit = 0;

    if (!wordbookId || !mongoose.Types.ObjectId.isValid(wordbookId)) {
        return res.status(400).json({ msg: '无效或缺失的 wordbookId' });
    }

    try {
        // 1. 获取用户和学习计划
        const user = await User.findById(userId).select('learningPlan').lean();
        const plan = user?.learningPlan;

        // 2. 严格根据会话模式设置限制数量
        if (sessionMode === 'new') {
            // 只学习新词模式: 无论是否有计划，都设置review为0
            newLimit = parseInt(req.query.newLimit || '10', 10);
            reviewLimit = 0;
            
            // 如果有活跃计划，使用计划的新词目标数
            if (plan && plan.isActive && plan.targetWordbook && 
                plan.targetWordbook.toString() === wordbookId) {
                newLimit = plan.dailyNewWordsTarget || newLimit;
            }
            
            console.log(`新词学习模式: 新词=${newLimit}, 复习=0`);
            
        } else if (sessionMode === 'review') {
            // 只复习模式: 无论是否有计划，都设置new为0
            reviewLimit = parseInt(req.query.reviewLimit || '20', 10);
            newLimit = 0;
            
            // 如果有活跃计划，使用计划的复习目标数
            if (plan && plan.isActive && plan.targetWordbook && 
                plan.targetWordbook.toString() === wordbookId) {
                reviewLimit = plan.dailyReviewWordsTarget || reviewLimit;
            }
            
            console.log(`复习模式: 新词=0, 复习=${reviewLimit}`);
            
        } else {
            // 混合模式 - 使用计划或默认/请求值
            if (plan && plan.isActive && plan.targetWordbook && 
                plan.targetWordbook.toString() === wordbookId) {
                newLimit = plan.dailyNewWordsTarget || 0;
                reviewLimit = plan.dailyReviewWordsTarget || 0;
                console.log(`使用学习计划限制: 新词=${newLimit}, 复习=${reviewLimit}`);
            } else {
                newLimit = parseInt(req.query.newLimit || '10', 10);
                reviewLimit = parseInt(req.query.reviewLimit || '20', 10);
                console.log(`使用默认限制: 新词=${newLimit}, 复习=${reviewLimit}`);
            }
        }

        // 3. 获取指定单词书中的所有单词ID
        const wordbook = await WordBook.findOne({ _id: wordbookId, owner: userId })
                                      .select('words')
                                      .lean();

        if (!wordbook) { 
            return res.status(404).json({ msg: '单词书未找到或无权访问' }); 
        }
        
        if (!wordbook.words || wordbook.words.length === 0) {
            return res.json({ 
                sessionWords: [],
                limits: { newLimit, reviewLimit, total: 0 }
            });
        }
        
        const wordbookWordIds = wordbook.words;

        // 4. 获取用户对这些单词的学习记录
        const records = await LearningRecord.find({
            user: userObjectId,
            word: { $in: wordbookWordIds }
        }).lean();

        // 5. 创建单词ID到学习记录的映射
        const recordMap = records.reduce((map, record) => {
            map[record.word.toString()] = record;
            return map;
        }, {});

        // 6. 筛选需要复习的单词ID
        const now = dayjs.utc().toDate();
        let reviewWordIds = [];
        
        // 如果不是纯新词模式，且复习限制大于0
        if (sessionMode !== 'new' && reviewLimit > 0) {
            wordbookWordIds.forEach(wordId => {
                const record = recordMap[wordId.toString()];
                // 条件：有记录、未掌握、已到复习时间
                if (record && 
                    record.status !== 'Mastered' && 
                    record.nextReviewAt && 
                    record.nextReviewAt <= now) {
                    reviewWordIds.push({ 
                        id: wordId, 
                        nextReviewAt: record.nextReviewAt 
                    });
                }
            });

            // 按复习时间排序并限制数量
            reviewWordIds.sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt));
            reviewWordIds = reviewWordIds.slice(0, reviewLimit).map(item => item.id);
            console.log(`将学习 ${reviewWordIds.length} 个复习单词（计划限制: ${reviewLimit}）`);
        } else {
            console.log('跳过复习单词');
        }

        // 7. 筛选新单词
        let newWordIds = [];
        
        // 如果不是纯复习模式，且新词限制大于0
        if (sessionMode !== 'review' && newLimit > 0) {
            // 随机打乱单词书中的单词
            const shuffledWordbookIds = [...wordbookWordIds].sort(() => 0.5 - Math.random());
            
            // 选择未学习过的单词
            for (const wordId of shuffledWordbookIds) {
                if (newWordIds.length >= newLimit) break;
                if (!recordMap[wordId.toString()]) {
                    newWordIds.push(wordId);
                }
            }
            
            console.log(`将学习 ${newWordIds.length} 个新单词（计划限制: ${newLimit}）`);
        } else {
            console.log('跳过新单词');
        }

        // 8. 合并单词列表
        // 确保单词不会重复（虽然理论上新词和复习词不会重叠）
        const sessionWordIdsSet = new Set([...reviewWordIds, ...newWordIds].map(id => id.toString()));
        const finalSessionWordIds = Array.from(sessionWordIdsSet).map(idStr => new mongoose.Types.ObjectId(idStr));
        
        // 计算实际总数
        const actualNewCount = newWordIds.length;
        const actualReviewCount = reviewWordIds.length;
        const totalCount = finalSessionWordIds.length;
        
        console.log(`会话总单词数: ${totalCount} = ${actualReviewCount}(复习) + ${actualNewCount}(新词)`);

        // 随机排序最终列表
        finalSessionWordIds.sort(() => Math.random() - 0.5);

        // 9. 获取这些单词的详细信息
        const wordDetails = await Word.find({ _id: { $in: finalSessionWordIds } })
            .select('spelling phonetic meaning difficulty tags examples')
            .lean();

        // 10. 创建单词ID到详细信息的映射
        const wordDetailMap = wordDetails.reduce((map, word) => {
            map[word._id.toString()] = word;
            return map;
        }, {});

        // 11. 构建最终的会话单词列表
        const sessionWords = finalSessionWordIds.map(wordId => {
            const detail = wordDetailMap[wordId.toString()];
            const record = recordMap[wordId.toString()];
            return {
                ...detail,
                _id: wordId,
                status: record ? record.status : 'New'
            };
        });

        // 12. 返回会话数据及限制信息
        res.json({ 
            sessionWords: sessionWords,
            sessionInfo: {
                mode: sessionMode,
                newLimit: newLimit,                  // 计划中的目标新词数 
                reviewLimit: reviewLimit,            // 计划中的目标复习词数
                actualNewCount: actualNewCount,      // 实际获取的新词数
                actualReviewCount: actualReviewCount, // 实际获取的复习词数
                totalCount: totalCount               // 总单词数
            }
        });

    } catch (err) {
        console.error('获取学习会话错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

module.exports = router;