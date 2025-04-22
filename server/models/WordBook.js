const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WordBookSchema = new Schema({
  name: { // 单词书名称，如 "四级核心词汇"
    type: String,
    required: true,
    trim: true
  },
  description: { // 描述
    type: String,
    trim: true
  },
  level: { // 级别/难度，如 'CET4', 'Beginner' 等
    type: String
  },
  category: { // 分类，如 '考试', '生活', '自定义'
    type: String
  },
  owner: { // 单词书的拥有者 (创建者)
    type: Schema.Types.ObjectId,
    ref: 'User', // 关联到 User 模型
    required: true
  },
  words: [{ // 包含的单词列表，存储单词的 ObjectId
    type: Schema.Types.ObjectId,
    ref: 'Word' // 关联到 Word 模型
  }],
  // totalWords: { // 单词总数，可以动态计算或在添加/删除单词时更新
  //   type: Number,
  //   default: 0
  // },
  isPublic: { // 是否公开给其他用户选择 (默认为私有)
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 在保存前更新 updatedAt 时间戳
WordBookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // 更新 totalWords (如果需要维护这个字段)
  // this.totalWords = this.words.length;
  next();
});
// 如果需要为用户的单词书列表添加索引
WordBookSchema.index({ owner: 1 });

module.exports = mongoose.model('WordBook', WordBookSchema);