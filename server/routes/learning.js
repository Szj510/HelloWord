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

// --- 获取新的学习会话单词列表 ---
// @route   GET api/learning/session
// @desc    获取一个包含待复习和新单词的学习会话列表
// @access  Private
router.get('/session', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { wordbookId } = req.query; // 从查询参数获取要学习的单词书 ID

    // --- V 定义本次会话的单词数量限制 (后续可改为用户设置) --- V
    let reviewLimit = parseInt(req.query.reviewLimit || '30', 10); // 最多复习 30 个
    let newLimit = parseInt(req.query.newLimit || '10', 10);       // 最多学习 10 个新词
    // --- ^ 定义结束 ^ ---

    if (!wordbookId || !mongoose.Types.ObjectId.isValid(wordbookId)) {
        return res.status(400).json({ msg: '无效或缺失的 wordbookId' });
    }

  try {
        const user = await User.findById(userId).select('learningPlan').lean();
         const plan = user?.learningPlan;

         // 如果存在激活的计划，并且计划针对的是当前请求的 wordbookId，则使用计划中的目标
         if (plan && plan.isActive && plan.targetWordbook && plan.targetWordbook.toString() === wordbookId) {
             console.log(`Using learning plan limits: New=${plan.dailyNewWordsTarget}, Review=${plan.dailyReviewWordsTarget}`);
             newLimit = plan.dailyNewWordsTarget;
             reviewLimit = plan.dailyReviewWordsTarget;
             // 也可以在这里检查 planEndDate 是否已过
         } else {
              console.log(`Using default limits: New=${newLimit}, Review=${reviewLimit}`);
          }
        // 1. 获取指定单词书中的所有单词 ID
        const wordbook = await WordBook.findOne({ _id: wordbookId, owner: userId })
                                      .select('words') // 只选择 words 字段
                                      .lean(); // 使用 lean 提高性能

        if (!wordbook) { return res.status(404).json({ msg: '单词书未找到或无权访问' }); }
        if (!wordbook.words || wordbook.words.length === 0) {
             return res.json({ sessionWords: [] }); // 空单词书，返回空会话
         }
        const wordbookWordIds = wordbook.words; // 这是 ObjectId 数组

        // 2. 获取这些单词的学习记录
        const records = await LearningRecord.find({
            user: userObjectId,
            word: { $in: wordbookWordIds }
        }).lean(); // lean

        // 3. 创建 Word ID 到 Learning Record 的映射，方便查找
        const recordMap = records.reduce((map, record) => {
            map[record.word.toString()] = record; // key 是 wordId 字符串
            return map;
        }, {});

        // 4. 筛选需要复习的单词 ID
        const now = dayjs.utc().toDate();
        let reviewWordIds = [];
        wordbookWordIds.forEach(wordId => {
            const record = recordMap[wordId.toString()];
            if (record && record.status !== 'Mastered' && record.nextReviewAt && record.nextReviewAt <= now) {
                reviewWordIds.push({ id: wordId, nextReviewAt: record.nextReviewAt }); // 携带复习时间用于排序
            }
        });

        // 按复习时间升序排序 (最该复习的在前)
        reviewWordIds.sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt));
        // 取出不超过 reviewLimit 的单词 ID
        reviewWordIds = reviewWordIds.slice(0, reviewLimit).map(item => item.id);

        // 5. 筛选新单词 ID
        let newWordIds = [];
        // 为了保证顺序，可以先打乱 wordbookWordIds
        const shuffledWordbookIds = [...wordbookWordIds].sort(() => 0.5 - Math.random());

        for (const wordId of shuffledWordbookIds) {
            if (newWordIds.length >= newLimit) break; // 达到新词上限
            if (!recordMap[wordId.toString()]) { // 如果在 map 中找不到记录，说明是新词
                newWordIds.push(wordId);
            }
        }

        // 6. 合并并去重 (理论上 review 和 new 不会重叠，但以防万一)
        const sessionWordIdsSet = new Set([...reviewWordIds, ...newWordIds].map(id => id.toString()));
        const finalSessionWordIds = Array.from(sessionWordIdsSet).map(idStr => new mongoose.Types.ObjectId(idStr));

         // --- V 增加会话内随机排序 --- V
         // 对最终的会话单词列表进行随机排序，避免总是先复习再学新词
         finalSessionWordIds.sort(() => Math.random() - 0.5);
         // --- ^ 排序结束 ^ ---


        // 7. 获取这些单词的详细信息
        const wordDetails = await Word.find({
            _id: { $in: finalSessionWordIds }
        }).select('spelling phonetic meaning difficulty tags examples').lean(); // 选择需要的字段

        // 8. 创建单词 ID 到详细信息的映射
        const wordDetailMap = wordDetails.reduce((map, word) => {
            map[word._id.toString()] = word;
            return map;
        }, {});

        // 9. 构建最终的会话单词列表，包含状态
        const sessionWords = finalSessionWordIds.map(wordId => {
            const detail = wordDetailMap[wordId.toString()];
            const record = recordMap[wordId.toString()];
            return {
                ...detail, // 包含 spelling, phonetic, meaning 等
                _id: wordId, // 确保 _id 正确
                status: record ? record.status : 'New' // 从记录获取状态，否则为 New
            };
        });

        res.json({ sessionWords }); // 返回包含单词对象（带状态）的数组

    } catch (err) {
        console.error('获取学习会话错误:', err.message);
        res.status(500).send('服务器错误');
    }
});

module.exports = router;