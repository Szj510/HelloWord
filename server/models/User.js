const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String },
  email: {
    type: String,
    required: true,
    unique: true,
    // 添加邮箱格式的基础验证 (可选，更复杂的验证应在逻辑中处理)
    match: [/.+\@.+\..+/, '请输入有效的邮箱地址']
  },
  password: { type: String, required: true },
  registerDate: { type: Date, default: Date.now },
  // --- V 新增验证相关字段 V ---
  isVerified: { // 邮箱是否已验证
    type: Boolean,
    default: false
  },
  verificationToken: { // 存储验证令牌 (存储哈希值更安全)
    type: String
  },
  verificationTokenExpires: { // 令牌过期时间
    type: Date
  },
  learningPlan: {
      isActive: { // 计划是否激活
         type: Boolean,
         default: false
      },
      targetWordbook: { // 计划针对的单词书 ID
          type: Schema.Types.ObjectId,
          ref: 'WordBook',
          default: null // null 表示没有设置计划或计划不针对特定书(如果允许跨书学习)
      },
      dailyNewWordsTarget: { // 每日新词目标数量
          type: Number,
          min: 0,
          default: 15 // 设置一个默认值
      },
      dailyReviewWordsTarget: { // 每日复习目标数量 (可以理解为 session 中 review 词的上限)
          type: Number,
          min: 0,
          default: 40 // 设置一个默认值
      },
      // planStartDate: { // 计划开始日期 (可选)
      //    type: Date
      // },
      planEndDate: { // 计划结束日期 (可选，用于有明确截止日期的计划)
         type: Date
      },
      lastUpdated: { // 计划最后更新时间
          type: Date
      }
  }
});

module.exports = mongoose.model('User', UserSchema);