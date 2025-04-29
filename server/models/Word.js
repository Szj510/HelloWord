const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WordSchema = new Schema({
  spelling: { // 单词拼写
    type: String,
    required: true,
    trim: true, // 去除前后空格
    // index: true // 可以为常用查询字段添加索引提高性能
  },
  phonetic: { // 音标
    type: String,
    trim: true
  },
  partOfSpeech: { // 词性，如 n. (名词), v. (动词), adj. (形容词) 等
    type: String,
    trim: true
  },
  meaning: { // 主要释义 (可以是简单字符串，或更复杂的结构)
    type: String, // 或者: Schema.Types.Mixed
    required: true
  },
  examples: [{ // 例句 (可以包含句子和翻译)
    sentence: String,
    translation: String
  }],
  difficulty: { // 难度系数 (例如 1-5)
    type: Number,
    min: 1,
    max: 5
  },
  tags: [String], // 标签，例如 'CET4', 'IELTS', '动词' 等
  // 可以添加其他字段，如 词根词缀、助记、英/美发音链接等
  // audio_uk: String,
  // audio_us: String,
  // root_affix: String,
  // mnemonic: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
  // 注意：这个模型代表一个“通用”的单词，可以被多个单词书引用
});

// 添加索引可以提高基于拼写的查找速度
WordSchema.index({ spelling: 1 });

module.exports = mongoose.model('Word', WordSchema);