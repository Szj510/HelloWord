const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Word = require('../models/Word');
const WordBook = require('../models/WordBook');
const LearningRecord = require('../models/LearningRecord');
const mongoose = require('mongoose');

// @route   GET api/hello
// @desc    测试 API 端点
// @access  Public
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Backend API!' });
});

// 导出路由
module.exports = router;