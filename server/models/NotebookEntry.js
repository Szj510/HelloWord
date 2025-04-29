const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotebookEntrySchema = new Schema({
    user: { // 关联用户
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    word: { // 关联的单词
        type: Schema.Types.ObjectId,
        ref: 'Word',
        required: true
    },
    addedFromWordbook: { // 从哪个单词书添加的 (记录来源)
        type: Schema.Types.ObjectId,
        ref: 'WordBook',
        required: true // 要求必须有关联的单词书来源
    },
    addedAt: { // 添加时间
        type: Date,
        default: Date.now
    }
    // 可以添加其他字段，如用户备注等
    // notes: { type: String, default: '' }
}, { timestamps: false }); // 这里不需要 Mongoose 的 timestamps

// 创建复合唯一索引，确保一个用户对一个单词只添加一次 (不论来源单词书)
// 如果允许同一单词从不同书多次加入，则移除此索引或修改
NotebookEntrySchema.index({ user: 1, word: 1 }, { unique: true });
// 为用户查询其生词本添加索引
NotebookEntrySchema.index({ user: 1, addedAt: -1 }); // 按添加时间倒序

module.exports = mongoose.model('NotebookEntry', NotebookEntrySchema);