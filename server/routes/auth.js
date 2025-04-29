const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // 用于生成随机验证码
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

    // 生成6位数字验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = verificationCode;
    user.verificationTokenExpires = Date.now() + 3600000; // 1小时后过期

    await user.save(); // 保存用户 (包含未验证状态和验证码)

    // --- 发送含有验证码的邮件 ---
    const emailSubject = '欢迎注册 HelloWord - 请验证您的邮箱';
    const emailText = `感谢注册 HelloWord!\n\n您的邮箱验证码为: ${verificationCode}\n\n请在应用中输入此验证码完成注册。验证码将在1小时后失效。\n\n如果您没有注册 HelloWord，请忽略此邮件。\n\nHelloWord 团队`;
    const emailHtml = `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>欢迎注册 HelloWord!</h2>
            <p>感谢您的注册。</p>
            <p>您的邮箱验证码为:</p>
            <div style="margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; text-align: center;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${verificationCode}</span>
            </div>
            <p>请在应用中输入此验证码完成注册。</p>
            <p>验证码将在 <strong>1 小时</strong> 后失效。</p>
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
      res.status(201).json({ msg: '注册成功！验证码已发送至您的邮箱，请查收并在验证页面输入。', email: user.email });

    } catch (emailError) {
      console.error("发送验证邮件失败:", emailError);
      // 用户已创建，但邮件发送失败
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
// @desc    验证邮箱 Token (旧方式 - 通过链接验证)
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

// --- 新增: 通过验证码验证邮箱 ---
// @route   POST api/auth/verify-code
// @desc    通过验证码验证邮箱
// @access  Public
router.post('/verify-code', async (req, res) => {
    const { email, verificationCode } = req.body;
    
    if (!email || !verificationCode) {
        return res.status(400).json({ msg: '请提供邮箱和验证码' });
    }

    try {
        // 1. 查找用户，条件：匹配邮箱和验证码，且验证码未过期
        const user = await User.findOne({
            email: email,
            verificationToken: verificationCode,
            verificationTokenExpires: { $gt: Date.now() } // 检查过期时间
        });

        // 2. 如果未找到用户或验证码已过期
        if (!user) {
            return res.status(400).json({ msg: '验证失败：无效或已过期的验证码' });
        }

        // 3. 找到用户，更新用户状态
        user.isVerified = true;
        user.verificationToken = undefined; // 清除验证码
        user.verificationTokenExpires = undefined; // 清除过期时间
        await user.save();

        console.log(`用户 ${user.email} 邮箱验证成功 (通过验证码)。`);

        // 4. 返回成功信息
        return res.status(200).json({ msg: '邮箱验证成功！您现在可以登录了。' });

    } catch (err) {
        console.error('验证码验证过程中出错:', err);
        return res.status(500).json({ msg: '服务器错误，请稍后重试' });
    }
});

// --- 新增: 重新发送验证码 ---
// @route   POST api/auth/resend-verification
// @desc    重新发送验证码
// @access  Public
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ msg: '请提供邮箱地址' });
    }

    try {
        // 1. 查找未验证的用户
        const user = await User.findOne({ 
            email: email,
            isVerified: false
        });

        if (!user) {
            return res.status(400).json({ msg: '找不到匹配的未验证用户' });
        }

        // 2. 生成新的验证码
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationCode;
        user.verificationTokenExpires = Date.now() + 3600000; // 1小时后过期
        await user.save();

        // 3. 发送新的验证码邮件
        const emailSubject = 'HelloWord - 您的新验证码';
        const emailText = `您好！\n\n您的新邮箱验证码为: ${verificationCode}\n\n请在应用中输入此验证码完成验证。验证码将在1小时后失效。\n\n如果您没有请求此验证码，请忽略此邮件。\n\nHelloWord 团队`;
        const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2>您的新验证码</h2>
                <p>您好！</p>
                <p>您的邮箱验证码为:</p>
                <div style="margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; text-align: center;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${verificationCode}</span>
                </div>
                <p>请在应用中输入此验证码完成验证。</p>
                <p>验证码将在 <strong>1 小时</strong> 后失效。</p>
                <hr/>
                <p style="font-size: 0.9em; color: #666;">如果您没有请求此验证码，请忽略此邮件。</p>
                <p style="font-size: 0.9em; color: #666;">HelloWord 团队</p>
            </div>`;

        await sendEmail({
            to: user.email,
            subject: emailSubject,
            text: emailText,
            html: emailHtml
        });

        res.status(200).json({ msg: '新的验证码已发送至您的邮箱' });

    } catch (err) {
        console.error('重新发送验证码失败:', err);
        res.status(500).json({ msg: '服务器错误，请稍后重试' });
    }
});

module.exports = router; // 导出路由