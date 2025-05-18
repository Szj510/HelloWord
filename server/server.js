const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const emailSender = require('./utils/emailSender');
const reminderService = require('./utils/reminderService');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(bodyParser.json());
app.use(cors());

// 可视化请求日志，便于开发环境调试
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/words', require('./routes/words'));
app.use('/api/wordbooks', require('./routes/wordbooks'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/notebook', require('./routes/notebook'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/vocabulary-test', require('./routes/vocabulary-test'));
app.use('/api', require('./routes/api')); // 通用API路由

// 静态资源发布
// 在生产环境中，使用React构建后的文件
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
    });
}

// 添加全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('全局错误处理:', err.stack);
    
    // 处理各种特定错误
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: '验证错误',
            details: err.message
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: '无效的令牌',
            details: '认证失败，请重新登录'
        });
    }
    
    // 默认错误响应
    res.status(500).json({
        error: '服务器错误',
        message: process.env.NODE_ENV === 'production' ? '发生了错误，请稍后再试' : err.message
    });
});

// 处理 404 错误
app.use((req, res) => {
    res.status(404).json({
        error: '未找到',
        message: `找不到请求的路径: ${req.originalUrl}`
    });
});

// 端口配置
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`服务器运行在端口: ${PORT}`);
    
    // 初始化邮件服务
    const emailConfig = {
        service: process.env.EMAIL_SERVICE,
        email: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS
    };
    
    emailSender.initEmailService(emailConfig)
        .then(isValid => {
            if (isValid) {
                console.log('邮件服务初始化成功');
            } else {
                console.warn('邮件服务配置无效，邮件功能将不可用');
            }
        })
        .catch(err => {
            console.error('邮件服务初始化失败:', err);
        });
    
    // 初始化学习提醒服务
    reminderService.initializeAllReminders()
        .then(() => {
            console.log('学习提醒服务初始化完成');
        })
        .catch(err => {
            console.error('学习提醒服务初始化失败:', err);
        });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    // 在生产环境中可以添加更多处理逻辑，例如发送报警邮件
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.info('收到 SIGTERM 信号，准备关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        // 关闭数据库连接
        mongoose.disconnect().then(() => {
            console.log('数据库连接已关闭');
            process.exit(0);
        });
    });
});

module.exports = server;