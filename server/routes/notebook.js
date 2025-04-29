const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const NotebookEntry = require('../models/NotebookEntry');
const Word = require('../models/Word');
const WordBook = require('../models/WordBook');
const mongoose = require('mongoose');

// --- 添加单词到生词本 ---
// @route   POST api/notebook/entries
// @desc    将一个单词添加到当前用户的生词本
// @access  Private
router.post('/entries', authMiddleware, async (req, res) => {
    const { wordId, wordbookId } = req.body; // 需要单词ID和来源单词书ID
    const userId = req.user.id;

    if (!wordId || !mongoose.Types.ObjectId.isValid(wordId)) {
        return res.status(400).json({ msg: '无效的单词 ID' });
    }
    if (!wordbookId || !mongoose.Types.ObjectId.isValid(wordbookId)) {
        return res.status(400).json({ msg: '无效的来源单词书 ID' });
    }

    try {
        // 检查单词和单词书是否存在 (可选但推荐)
        const [wordExists, wordbookExists] = await Promise.all([
             Word.findById(wordId).lean(),
             WordBook.findOne({ _id: wordbookId, owner: userId }).lean() // 确认单词书属于用户或存在
             // 如果允许从公共单词书添加，这里的检查需要调整
        ]);
        if (!wordExists) return res.status(404).json({ msg: '单词不存在' });
        // if (!wordbookExists) return res.status(404).json({ msg: '来源单词书不存在或无权访问' }); // 根据业务逻辑决定是否严格检查来源单词书

        // 检查是否已存在 (利用唯一索引，或者先查询)
        const existingEntry = await NotebookEntry.findOne({ user: userId, word: wordId });
        if (existingEntry) {
            return res.status(400).json({ msg: '该单词已在生词本中' });
        }

        // 创建新的生词本条目
        const newEntry = new NotebookEntry({
            user: userId,
            word: wordId,
            addedFromWordbook: wordbookId
        });

        await newEntry.save();
        // 返回创建的条目，并填充单词信息以便前端直接使用
        const populatedEntry = await NotebookEntry.findById(newEntry._id)
                                                .populate('word', 'spelling meaning phonetic')
                                                .populate('addedFromWordbook', 'name') // 填充来源单词书名称
                                                .lean();

        res.status(201).json(populatedEntry);

    } catch (err) {
        console.error("添加生词错误:", err.message);
        if (err.code === 11000) { // 唯一索引冲突
             return res.status(400).json({ msg: '该单词已在生词本中 (duplicate)' });
         }
        res.status(500).send('服务器错误');
    }
});

// --- 从生词本移除单词 ---
// @route   DELETE api/notebook/entries/:wordId
// @desc    从当前用户的生词本中移除一个单词
// @access  Private
router.delete('/entries/:wordId', authMiddleware, async (req, res) => {
    const { wordId } = req.params;
    const userId = req.user.id;

    if (!wordId || !mongoose.Types.ObjectId.isValid(wordId)) {
        return res.status(400).json({ msg: '无效的单词 ID' });
    }

    try {
        const deleteResult = await NotebookEntry.deleteOne({ user: userId, word: wordId });

        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ msg: '在生词本中未找到该单词' });
        }

        res.json({ msg: '单词已从生词本移除' });

    } catch (err) {
        console.error("移除生词错误:", err.message);
        res.status(500).send('服务器错误');
    }
});

// --- 获取用户的生词本内容 (按来源单词书分组) ---
// @route   GET api/notebook/entries
// @desc    获取当前用户生词本的所有单词，按来源单词书分组
// @access  Private
router.get('/entries', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { fields } = req.query;

    try {
        if (fields === 'wordId') {
            // 只查询 word 字段，并使用 lean() 和 distinct() 获取不重复的 word ID
            const entries = await NotebookEntry.find({ user: userObjectId }).select('word').lean();
            const wordIds = [...new Set(entries.map(e => e.word.toString()))]; // 去重并转字符串
            return res.json({ wordIds }); // 返回 { wordIds: [...] }
        }
        const entriesGrouped = await NotebookEntry.aggregate([
            { $match: { user: userObjectId } },
            { $sort: { addedAt: -1 } },
            { $lookup: { from: 'words', localField: 'word', foreignField: '_id', as: 'wordDetails' } },
            { $unwind: { path: "$wordDetails", preserveNullAndEmptyArrays: true } }, // 保留没有关联到 word 的记录
            { $lookup: { from: 'wordbooks', localField: 'addedFromWordbook', foreignField: '_id', as: 'wordbookDetails' } },
            { $unwind: { path: "$wordbookDetails", preserveNullAndEmptyArrays: true } }, // 保留没有关联到 wordbook 的记录

            {
                $group: {
                    _id: '$addedFromWordbook', // 按单词书 ID 分组
                    // 使用 $first 和 $ifNull 获取名称，处理 wordbook 可能已被删除的情况
                    wordbookName: { $first: { $ifNull: ['$wordbookDetails.name', '未知来源'] } },
                    entries: {
                        $push: { // 将单词信息推入数组
                            entryId: '$_id',
                            wordId: '$word',
                            // 对可能不存在的 wordDetails 中的字段也使用 $ifNull
                            spelling: { $ifNull: ['$wordDetails.spelling', '未知单词'] },
                            meaning: { $ifNull: ['$wordDetails.meaning', ''] },
                            phonetic: { $ifNull: ['$wordDetails.phonetic', ''] },
                            addedAt: '$addedAt'
                        }
                    }
                }
            },
             { // 按单词书名称排序 (可选)
                 $sort: { 'wordbookName': 1 }
             },
             { // 最终输出格式调整
                 $project: { // 最终输出格式
                    _id: 0, // 不输出分组 ID
                    wordbookId: '$_id', // 重命名分组 ID
                    wordbookName: 1, // wordbookName 已在 group 中处理 null
                    entries: 1
                }
             }
        ]);

        res.json(entriesGrouped);
    } catch (err) {
        console.error("获取生词本错误:", err.message);
        res.status(500).send('服务器错误');
    }
});


// --- 将生词本导出为新的单词书 ---
// @route   POST api/notebook/export
// @desc    将当前用户生词本中的所有单词导出为一个新的单词书
// @access  Private
router.post('/export', authMiddleware, async (req, res) => {
    const { name, description } = req.body; // 新单词书的名称和描述
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);


    if (!name) {
        return res.status(400).json({ msg: '新单词书名称不能为空' });
    }

    try {
        // 1. 获取用户生词本中所有不同的单词 ID
        const notebookWordIds = await NotebookEntry.distinct('word', { user: userObjectId });

        if (notebookWordIds.length === 0) {
            return res.status(400).json({ msg: '生词本为空，无法导出' });
        }

        // 2. 创建新的单词书
        const newWordBook = new WordBook({
            name: name,
            description: description || `来自生词本的导出 (${new Date().toLocaleDateString()})`,
            owner: userId,
            words: notebookWordIds, // 使用生词本中的单词 ID
            isPublic: false, // 导出的单词书默认为私有
            category: '生词本导出', // 设置一个分类
            // level 可以不设置或根据单词来源分析
        });

        // 3. 保存新单词书
        const savedWordBook = await newWordBook.save();

        // 4. (可选) 是否清空生词本？ 暂时不清空
        // await NotebookEntry.deleteMany({ user: userObjectId });

        res.status(201).json({ msg: '生词本已成功导出为新单词书', wordbook: savedWordBook });

    } catch (err) {
        console.error("导出生词本错误:", err.message);
        res.status(500).send('服务器错误');
    }
});


module.exports = router;