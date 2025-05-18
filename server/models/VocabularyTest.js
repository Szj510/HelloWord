const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VocabularyTestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  // 测试结果
  totalWords: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  estimatedVocabulary: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient'],
    default: 'beginner'
  },
  // 测试详情
  testWords: [{
    word: {
      type: Schema.Types.ObjectId,
      ref: 'Word'
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5
    },
    userAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean
    },
    answeredAt: {
      type: Date
    }
  }]
}, { timestamps: true });

// 创建索引以便快速查询用户的测试记录
VocabularyTestSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('VocabularyTest', VocabularyTestSchema); 