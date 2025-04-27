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
  }
  // --- ^ 新增结束 ^ ---
  // learningGoal: { type: String, default: null },
  // dailyTarget: { type: Number, default: 20 }
});

module.exports = mongoose.model('User', UserSchema);