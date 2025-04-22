const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 创建 Schema
const UserSchema = new Schema({
  // 根据需求文档 3.4.3 实体类定义表，User实体包含 username, email, password等
  // 也可以根据实际注册/登录需求调整，例如，如果仅用邮箱登录，username 可以非必需
  username: {
    type: String,
    // required: true, // 如果用户名是必需的
    // unique: true    // 如果用户名需要唯一
  },
  email: {
    type: String,
    required: true, // 邮箱通常是必需的
    unique: true    // 邮箱必须是唯一的
  },
  password: {
    type: String,
    required: true  // 密码是必需的 (存储的是哈希后的密码)
  },
  registerDate: {
    type: Date,
    default: Date.now // 注册日期，默认为当前时间
  },
  // 可以在后续开发中添加 需求文档中提到的 learningGoal, dailyTarget 等字段
  // learningGoal: {
  //   type: String,
  //   default: null
  // },
  // dailyTarget: {
  //   type: Number,
  //   default: 20 // 例如，默认每日目标20个单词
  // }
});

// 创建并导出模型，'User' 是模型的名称，MongoDB 会将其转换为小写复数形式 'users' 作为集合名称
module.exports = mongoose.model('User', UserSchema);