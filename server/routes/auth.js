const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // 引入 crypto 用于生成 token
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });
const sendEmail = require('../utils/emailSender');

// --- 注册路由 ---
// @route   POST api/auth/register
// @desc    注册新用户
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  // --- V 增强邮箱和密码验证 V ---
  if (!email || !password) { return res.status(400).json({ msg: '请输入邮箱和密码' }); }
  // 简单的邮箱格式检查 (更复杂的建议用 validator 库)
  if (!/.+\@.+\..+/.test(email)) { return res.status(400).json({ msg: '请输入有效的邮箱地址' }); }
  if (password.length < 6) { return res.status(400).json({ msg: '密码长度至少为 6 位' }); }
  // --- ^ 验证结束 ^ ---

  try {
    let user = await User.findOne({ email });
    if (user) { return res.status(400).json({ msg: '该邮箱已被注册' }); }

    user = new User({ username, email, password }); // isVerified 默认为 false

    // 哈希密码 (不变)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken; // <-- 直接存储原始 Token
    user.verificationTokenExpires = Date.now() + 3600000; // 1 hour

    await user.save(); // 保存用户 (包含未验证状态和 token)

    // --- V 发送验证邮件 (暂时注释掉实际发送，只打印链接) V ---
    // 构建验证 URL (根据你的前端路由调整)
    // 需要在 .env 中定义 FRONTEND_URL=http://localhost:3000
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    const emailSubject = '欢迎注册 HelloWord - 请验证您的邮箱';
    const emailText = `感谢注册 HelloWord!\n\n请点击以下链接或将其复制到浏览器地址栏以验证您的邮箱:\n${verificationUrl}\n\n此链接将在 1 小时后失效。\n\n如果您没有注册 HelloWord，请忽略此邮件。\n\nHelloWord 团队`;
    const emailHtml = `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>欢迎注册 HelloWord!</h2>
            <p>感谢您的注册。</p>
            <p>请点击下面的按钮验证您的邮箱地址:</p>
            <p style="margin: 20px 0;">
                <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">验证邮箱</a>
            </p>
            <p>如果按钮无法点击，请将以下链接复制到浏览器地址栏:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>此链接将在 <strong>1 小时</strong> 后失效。</p>
            <hr/>
            <p style="font-size: 0.9em; color: #666;">如果您没有注册 HelloWord，请忽略此邮件。</p>
            <p style="font-size: 0.9em; color: #666;">HelloWord 团队</p>
        </div>`;

    try {
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml // 发送 HTML 格式邮件
      });
      console.log(`验证邮件已发送至 ${user.email}`);
      res.status(201).json({ msg: '注册成功！验证邮件已发送至您的邮箱，请查收并点击链接完成验证。' });

    } catch (emailError) {
      console.error("发送验证邮件失败:", emailError);
      // 用户已创建，但邮件发送失败
      // 可以考虑让用户在登录时提示“未验证”并提供“重新发送邮件”的选项
      // 目前先返回一个更具体的错误给前端（虽然前端目前统一处理）
      res.status(200).json({ // 返回 200 OK 但带有警告信息
          msg: '注册成功，但发送验证邮件失败。请稍后尝试登录或联系支持以重新发送验证邮件。',
          warning: 'Email failed'
      });
    }

  } catch (err) {
    console.error('注册错误:', err.message);
    // 检查是否是 Mongoose 验证错误
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ msg: messages.join(', ') });
    }
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

    if (!user.isVerified) {
        // 可以选择提示用户，或者提供重新发送验证邮件的选项
        return res.status(401).json({ msg: '您的邮箱尚未验证，请检查您的收件箱。' });
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

// --- V 新增: 邮箱验证路由 V ---
// @route   GET api/auth/verify/:token
// @desc    验证邮箱 Token
// @access  Public
router.get('/verify/:token', async (req, res) => {
    const verificationToken = req.params.token;
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
        // 1. 查找用户，条件：匹配 verificationToken 且 token 未过期
        const user = await User.findOne({
            verificationToken: verificationToken,
            verificationTokenExpires: { $gt: Date.now() } // 检查过期时间
        });

        // 2. 如果未找到用户或 token 已过期
        if (!user) {
            console.log(`验证失败：无效或已过期的 Token - ${verificationToken}`);
            // 重定向到前端的验证失败页面
            return res.redirect(`${frontendBaseUrl}/verification-failed?reason=invalid_or_expired`);
        }

        // 3. 找到用户，更新用户状态
        user.isVerified = true;
        user.verificationToken = undefined; // 清除 token
        user.verificationTokenExpires = undefined; // 清除过期时间
        await user.save();

        console.log(`用户 ${user.email} 邮箱验证成功。`);

        // 4. 重定向到前端的验证成功页面
        res.redirect(`${frontendBaseUrl}/verification-success`);

    } catch (err) {
        console.error('邮箱验证过程中出错:', err);
        // 发生服务器内部错误，重定向到失败页面并带上错误标识
        res.redirect(`${frontendBaseUrl}/verification-failed?reason=server_error`);
    }
});
module.exports = router; // 导出路由