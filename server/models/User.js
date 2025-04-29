const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 定义学习计划的Schema
const LearningPlanSchema = new Schema({
  isActive: { // 计划是否激活
    type: Boolean,
    default: false
  },
  targetWordbook: { // 计划针对的单词书 ID
    type: Schema.Types.ObjectId,
    ref: 'WordBook',
    required: true
  },
  dailyNewWordsTarget: { // 每日新词目标数量
    type: Number,
    min: 0,
    default: 15 // 设置一个默认值
  },
  dailyReviewWordsTarget: { // 每日复习目标数量
    type: Number,
    min: 0,
    default: 40 // 设置一个默认值
  },
  planEndDate: { // 计划结束日期 (可选)
    type: Date
  },
  reminderEnabled: { // 是否启用学习提醒
    type: Boolean,
    default: false
  },
  reminderTime: { // 提醒时间 (24小时制，如 "08:00")
    type: String,
    default: "08:00"
  },
  createdAt: { // 计划创建时间
    type: Date,
    default: Date.now
  },
  lastUpdated: { // 计划最后更新时间
    type: Date,
    default: Date.now
  }
});

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
  // --- V 验证相关字段 V ---
  isVerified: { // 邮箱是否已验证
    type: Boolean,
    default: false
  },
  verificationToken: { // 存储验证码 (6位数字)
    type: String
  },
  verificationTokenExpires: { // 验证码过期时间
    type: Date
  },
  // 存储多个学习计划
  plans: [LearningPlanSchema],
  
  // 当前激活的计划ID (指向plans数组中的某一项)
  currentPlanId: {
    type: Schema.Types.ObjectId
  },
  
  // 保留旧的learningPlan结构以保持向后兼容
  learningPlan: {
    isActive: { // 计划是否激活
       type: Boolean,
       default: false
    },
    targetWordbook: { // 计划针对的单词书 ID
        type: Schema.Types.ObjectId,
        ref: 'WordBook',
        default: null // null 表示没有设置计划或计划不针对特定书
    },
    dailyNewWordsTarget: { // 每日新词目标数量
        type: Number,
        min: 0,
        default: 15 // 设置一个默认值
    },
    dailyReviewWordsTarget: { // 每日复习目标数量
        type: Number,
        min: 0,
        default: 40 // 设置一个默认值
    },
    planEndDate: { // 计划结束日期 (可选)
       type: Date
    },
    lastUpdated: { // 计划最后更新时间
        type: Date
    }
  }
});

module.exports = mongoose.model('User', UserSchema);