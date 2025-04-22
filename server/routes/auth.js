const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // 引入 User 模型
require('dotenv').config({ path: '../.env' }); // 确保能加载 .env 文件中的 JWT_SECRET

// --- 注册路由 ---
// @route   POST api/auth/register
// @desc    注册新用户
// @access  Public
router.post('/register', async (req, res) => {
  // 简单的输入验证 (可以后续添加更复杂的验证库如 express-validator)
  const { username, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: '请输入邮箱和密码' });
  }
  // 注意: 这里假设 username 是可选的，如果必需，也应加入检查

  try {
    // 1. 检查用户是否已存在
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: '该邮箱已被注册' });
    }

    // 2. 创建新用户实例 (密码还未哈希)
    user = new User({
      username, // 如果 req.body 中没有 username, 则为 undefined, Mongoose 不会保存它 (除非 schema 中有 default)
      email,
      password // 原始密码，稍后哈希
    });

    // 3. 哈希密码
    const salt = await bcrypt.genSalt(10); // 生成 salt, 10 是复杂度轮数
    user.password = await bcrypt.hash(password, salt); // 对密码进行哈希处理

    // 4. 保存用户到数据库
    await user.save();

    // 5. 创建 JWT Payload (令牌中包含的数据)
    const payload = {
      user: {
        id: user.id // 使用 Mongoose 生成的 _id 作为用户标识
        // 不要在 payload 中存放敏感信息
      }
    };

    // 6. 签发 JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // 使用 .env 中的密钥
      { expiresIn: '7d' }, // 令牌有效期 (例如: 1小时 '1h', 7天 '7d')
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token }); // 注册成功，返回 token
      }
    );

  } catch (err) {
    console.error('注册错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

// --- 登录路由 ---
// @route   POST api/auth/login
// @desc    用户登录并获取 token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 简单的输入验证
  if (!email || !password) {
    return res.status(400).json({ msg: '请输入邮箱和密码' });
  }

  try {
    // 1. 检查用户是否存在
    const user = await User.findOne({ email });
    if (!user) {
      // 为了安全，不明确提示是邮箱不存在还是密码错误
      return res.status(400).json({ msg: '邮箱或密码无效' });
    }

    // 2. 比较密码
    const isMatch = await bcrypt.compare(password, user.password); // 比较提交的密码和数据库中哈希后的密码
    if (!isMatch) {
      return res.status(400).json({ msg: '邮箱或密码无效' });
    }

    // 3. 用户验证成功，创建 JWT Payload
    const payload = {
      user: {
        id: user.id
      }
    };

    // 4. 签发 JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // 保持和注册时一致或根据需要调整
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // 登录成功，返回 token
      }
    );

  } catch (err) {
    console.error('登录错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router; // 导出路由