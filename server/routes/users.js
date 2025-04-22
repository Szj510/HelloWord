const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // 引入认证中间件
const User = require('../models/User'); // 引入 User 模型

// @route   GET api/users/me
// @desc    获取当前登录用户的信息
// @access  Private (需要 Token)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // authMiddleware 已经验证了 token 并将 user id 放到了 req.user.id
    // 从数据库中查找用户，但不返回密码 (-password)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: '用户未找到' }); // 理论上不应该发生，因为 token 有效
    }
    res.json(user); // 返回用户信息
  } catch (err) {
    console.error('获取用户信息错误:', err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;