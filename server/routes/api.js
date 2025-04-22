const express = require('express');
const router = express.Router();

// @route   GET api/hello
// @desc    测试 API 端点
// @access  Public
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Backend API!' });
});

// --- 未来添加其他路由 ---
// 例如: 用户认证路由
// const authRoutes = require('./auth');
// router.use('/auth', authRoutes);

// 例如: 单词学习路由
// const learningRoutes = require('./learning');
// router.use('/learning', learningRoutes);

module.exports = router;