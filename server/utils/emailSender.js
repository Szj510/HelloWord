const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' }); // Load .env relative to this file's parent

// --- 配置 Nodemailer Transporter ---
// 选择并配置你的邮件发送方式
// **示例 1: 使用 Ethereal (用于测试)**
// 1. 访问 https://ethereal.email/ 获取测试账号
// 2. 将账号信息填入 .env 文件:
//    EMAIL_HOST=smtp.ethereal.email
//    EMAIL_PORT=587
//    EMAIL_USER=YOUR_ETHEREAL_USER@ethereal.email
//    EMAIL_PASS=YOUR_ETHEREAL_PASSWORD
//
// **示例 2: 使用 Gmail (需要 App Password 或调整安全设置)**
// 1. 在 .env 中设置:
//    EMAIL_SERVICE=gmail
//    EMAIL_USER=your_gmail_address@gmail.com
//    EMAIL_PASS=your_gmail_app_password
//
// **示例 3: 使用通用 SMTP**
// 1. 在 .env 中设置:
//    EMAIL_HOST=your_smtp_host.com
//    EMAIL_PORT=your_smtp_port // e.g., 587 or 465
//    EMAIL_SECURE=false // true for 465, false for 587/other (starttls)
//    EMAIL_USER=your_smtp_username
//    EMAIL_PASS=your_smtp_password
//    EMAIL_FROM='"Your App Name" <no-reply@yourapp.com>' // 发件人显示

let transporterConfig;

if (process.env.EMAIL_SERVICE === 'gmail') {
    transporterConfig = {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Gmail App Password
        },
    };
} else if (process.env.EMAIL_HOST) { // 通用 SMTP 或 Ethereal
     transporterConfig = {
         host: process.env.EMAIL_HOST,
         port: parseInt(process.env.EMAIL_PORT || '587', 10), // 默认 587
         secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
         auth: {
             user: process.env.EMAIL_USER,
             pass: process.env.EMAIL_PASS,
         },
     };
} else {
     console.warn("警告: 未配置邮件服务。邮件将不会被发送。请在 .env 文件中配置 EMAIL_HOST 或 EMAIL_SERVICE。");
     // 可以创建一个 "dummy" transporter 来避免在未配置时出错
     transporterConfig = { jsonTransport: true }; // Sends messages as JSON blobs, useful for testing without network
}

const transporter = nodemailer.createTransport(transporterConfig);

// --- 发送邮件函数 ---
/**
 * Sends an email.
 * @param {object} options - Email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.text - Plain text body.
 * @param {string} [options.html] - HTML body (optional).
 */
const sendEmail = async ({ to, subject, text, html }) => {
     // 如果没有配置真实的 transporter，则不发送
     if (transporterConfig.jsonTransport) {
         console.log(`模拟发送邮件到: ${to}, 主题: ${subject}`);
         console.log(`文本内容: ${text}`);
         if(html) console.log(`HTML 内容: ${html}`);
         return { messageId: `mock-${Date.now()}` }; // 返回模拟信息
     }

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"HelloWord App" <noreply@example.com>`, // 使用配置的发件人或默认值
        to: to,
        subject: subject,
        text: text,
        html: html, // 可以同时提供 text 和 html 版本
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('邮件已发送: %s', info.messageId);
        // 如果使用 Ethereal，打印预览 URL
        if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
            console.log('Ethereal 预览 URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (error) {
        console.error('发送邮件时出错:', error);
        throw new Error('邮件发送失败'); // 抛出错误，让调用者处理
    }
};

module.exports = sendEmail;