const nodemailer = require('nodemailer');

// 邮件传输器实例
let transporter = null;

/**
 * 初始化邮件服务
 * @param {Object} config - 邮件服务配置
 */
function initEmailService(config) {
    if (!config || !config.email || !config.password) {
        console.warn('邮件服务配置不完整，邮件功能将不可用');
        return Promise.resolve(false);
    }

    // 针对Gmail的特殊配置
    if (config.service === 'gmail') {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // 使用SSL
            auth: {
                user: config.email,
                pass: config.password  // 这应该是Gmail的应用专用密码
            },
            tls: {
                rejectUnauthorized: false // 在测试环境可能需要此项
            }
        });
    }
    // 针对QQ邮箱的特殊配置
    else if (config.service === 'qq') {
        transporter = nodemailer.createTransport({
            host: 'smtp.qq.com',
            port: 465,
            secure: true, // 使用SSL
            auth: {
                user: config.email,
                pass: config.password  // 这应该是QQ邮箱的授权码，不是QQ密码
            }
        });
    }
    else {
        // 其他邮件服务的通用配置
        transporter = nodemailer.createTransport({
            service: config.service || 'gmail',
            host: config.host,
            port: config.port || (config.secure ? 465 : 587),
            secure: config.secure || false,
            auth: {
                user: config.email,
                pass: config.password
            }
        });
    }

    // 验证连接配置
    return transporter.verify()
        .then(() => {
            console.log('📧 邮件服务初始化成功');
            return true;
        })
        .catch(err => {
            console.error('📧 邮件服务初始化失败:', err);

            // 为常见错误提供更具体的指导
            if (err.code === 'EAUTH') {
                if (config.service === 'gmail') {
                    console.error('Gmail认证失败。请确保：\n' +
                      '1. 您使用的是正确的Gmail邮箱和密码\n' +
                      '2. 您已开启"允许不够安全的应用访问"或使用应用专用密码\n' +
                      '3. 如果启用了两步验证，必须使用应用专用密码：https://myaccount.google.com/apppasswords');
                } else if (config.service === 'qq') {
                    console.error('QQ邮箱认证失败。请确保：\n' +
                      '1. 您使用的是正确的QQ邮箱\n' +
                      '2. 密码使用的是授权码，不是QQ密码\n' +
                      '3. 授权码可在QQ邮箱设置 -> 账户 -> POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务中获取');
                } else {
                    console.error('邮件服务认证失败，请检查邮箱账号和密码是否正确');
                }
            }

            return false;
        });
}

/**
 * 发送纯文本邮件
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} text - 邮件内容
 * @returns {Promise}
 */
async function sendTextEmail(to, subject, text) {
    if (!transporter) {
        throw new Error('邮件服务未初始化');
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Hello Word <no-reply@helloword.app>',
        to,
        subject,
        text
    };

    return transporter.sendMail(mailOptions);
}

/**
 * 发送HTML格式邮件
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - HTML格式邮件内容
 * @returns {Promise}
 */
async function sendHtmlEmail(to, subject, html) {
    if (!transporter) {
        throw new Error('邮件服务未初始化');
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Hello Word <no-reply@helloword.app>',
        to,
        subject,
        html
    };

    return transporter.sendMail(mailOptions);
}

/**
 * 发送带附件的邮件
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} text - 邮件文本内容
 * @param {string} html - 邮件HTML内容 (可选)
 * @param {Array} attachments - 附件列表 [{filename, path}]
 * @returns {Promise}
 */
async function sendEmailWithAttachments(to, subject, text, html, attachments) {
    if (!transporter) {
        throw new Error('邮件服务未初始化');
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Hello Word <no-reply@helloword.app>',
        to,
        subject,
        text,
        html,
        attachments
    };

    return transporter.sendMail(mailOptions);
}

/**
 * 发送验证码邮件
 * @param {string} to - 收件人邮箱
 * @param {string} username - 用户名
 * @param {string} code - 验证码
 * @returns {Promise}
 */
async function sendVerificationEmail(to, username, code) {
    const subject = 'Hello Word - 邮箱验证码';
    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #a67c52;">Hello Word</h1>
                <p style="font-size: 16px;">您的专属单词学习助手</p>
            </div>

            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #555;">您好，${username}！</h2>
                <p>感谢您注册 Hello Word 单词学习应用。请使用以下验证码完成邮箱验证：</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 15px 40px; background-color: #fff; border-radius: 6px; border: 1px solid #ddd; letter-spacing: 5px; font-size: 24px; font-weight: bold;">
                        ${code}
                    </div>
                </div>
                <p>验证码有效期为30分钟。如果不是您本人操作，请忽略此邮件。</p>
            </div>

            <div style="text-align: center; color: #777; font-size: 12px;">
                <p>这是系统自动发送的邮件，请勿直接回复。</p>
                <p>&copy; ${new Date().getFullYear()} Hello Word 单词学习应用. 保留所有权利。</p>
            </div>
        </div>
    `;

    return sendHtmlEmail(to, subject, html);
}

/**
 * 发送密码重置邮件
 * @param {string} to - 收件人邮箱
 * @param {string} username - 用户名
 * @param {string} code - 重置码
 * @returns {Promise}
 */
async function sendPasswordResetEmail(to, username, code) {
    const subject = 'Hello Word - 密码重置验证码';
    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #a67c52;">Hello Word</h1>
                <p style="font-size: 16px;">您的专属单词学习助手</p>
            </div>

            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #555;">您好，${username}！</h2>
                <p>我们收到了您的密码重置请求。请使用以下验证码重置您的密码：</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 15px 40px; background-color: #fff; border-radius: 6px; border: 1px solid #ddd; letter-spacing: 5px; font-size: 24px; font-weight: bold;">
                        ${code}
                    </div>
                </div>
                <p>验证码有效期为30分钟。如果不是您本人操作，请立即修改密码以确保账户安全。</p>
            </div>

            <div style="text-align: center; color: #777; font-size: 12px;">
                <p>这是系统自动发送的邮件，请勿直接回复。</p>
                <p>&copy; ${new Date().getFullYear()} Hello Word 单词学习应用. 保留所有权利。</p>
            </div>
        </div>
    `;

    return sendHtmlEmail(to, subject, html);
}

/**
 * 发送学习提醒邮件
 * @param {string} to - 收件人邮箱
 * @param {string} username - 用户名
 * @param {Object} stats - 用户学习统计数据
 * @returns {Promise}
 */
async function sendLearningReminderEmail(to, username, stats) {
    const subject = 'Hello Word - 今日学习提醒';

    // 获取鼓励语
    const encouragements = [
        '坚持就是胜利，今天也要加油哦！',
        '点滴积累，必有所成。今天也不要错过学习机会！',
        '学习是一种习惯，让我们一起保持这个好习惯！',
        '每天进步一点点，离目标就更近一步。',
        '今天学一个单词，明天就能认识一篇文章。'
    ];
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #a67c52;">Hello Word</h1>
                <p style="font-size: 16px;">您的专属单词学习助手</p>
            </div>

            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #555;">您好，${username}！</h2>
                <p>别忘了今天的单词学习计划哦！</p>

                <div style="background-color: #fff; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #a67c52;">您的学习数据</h3>
                    <p><strong>连续学习天数:</strong> ${stats.streak} 天</p>
                    <p><strong>已学单词总数:</strong> ${stats.totalWordsLearned} 个</p>
                    <p><strong>今日学习目标:</strong> ${stats.dailyGoal} 个新单词</p>
                </div>

                <p style="font-style: italic; text-align: center; margin-top: 20px;">"${randomEncouragement}"</p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 10px 20px; background-color: #a67c52; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">立即开始学习</a>
                </div>
            </div>

            <div style="text-align: center; color: #777; font-size: 12px;">
                <p>这是系统自动发送的邮件，请勿直接回复。</p>
                <p>如果您不想再收到此类提醒，可以在应用设置中关闭提醒功能。</p>
                <p>&copy; ${new Date().getFullYear()} Hello Word 单词学习应用. 保留所有权利。</p>
            </div>
        </div>
    `;

    return sendHtmlEmail(to, subject, html);
}

/**
 * 发送周报邮件
 * @param {string} to - 收件人邮箱
 * @param {string} username - 用户名
 * @param {Object} weeklyStats - 周学习统计
 * @returns {Promise}
 */
async function sendWeeklyReportEmail(to, username, weeklyStats) {
    const subject = 'Hello Word - 本周学习报告';

    // 计算完成率
    const completionRate = weeklyStats.daysLearned / 7 * 100;
    let completionMessage = '';

    if (completionRate >= 100) {
        completionMessage = '太棒了！您完成了本周的所有学习目标。';
    } else if (completionRate >= 80) {
        completionMessage = '表现很好！继续保持这样的学习热情。';
    } else if (completionRate >= 50) {
        completionMessage = '还不错，下周可以再接再厉！';
    } else {
        completionMessage = '坚持是成功的关键，下周让我们一起加油！';
    }

    const html = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #a67c52;">Hello Word</h1>
                <p style="font-size: 16px;">您的专属单词学习助手</p>
            </div>

            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #555;">您好，${username}！</h2>
                <p>这是您本周的单词学习总结报告：</p>

                <div style="background-color: #fff; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #a67c52; text-align: center;">本周学习报告</h3>

                    <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                        <div style="text-align: center; padding: 10px; flex: 1;">
                            <div style="font-size: 28px; font-weight: bold; color: #a67c52;">${weeklyStats.newWordsLearned}</div>
                            <div>学习新单词</div>
                        </div>
                        <div style="text-align: center; padding: 10px; flex: 1;">
                            <div style="font-size: 28px; font-weight: bold; color: #a67c52;">${weeklyStats.wordsReviewed}</div>
                            <div>复习单词</div>
                        </div>
                        <div style="text-align: center; padding: 10px; flex: 1;">
                            <div style="font-size: 28px; font-weight: bold; color: #a67c52;">${weeklyStats.daysLearned}</div>
                            <div>学习天数</div>
                        </div>
                    </div>

                    <div style="margin: 20px 0; text-align: center;">
                        <div style="background-color: #f3f3f3; border-radius: 10px; height: 20px; width: 100%; overflow: hidden;">
                            <div style="background-color: #a67c52; height: 100%; width: ${completionRate}%;"></div>
                        </div>
                        <div style="margin-top: 5px; font-size: 12px;">完成率：${completionRate.toFixed(0)}%</div>
                    </div>

                    <p style="text-align: center; margin-top: 15px;">${completionMessage}</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/statistics" style="display: inline-block; padding: 10px 20px; background-color: #a67c52; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">查看详细统计</a>
                </div>
            </div>

            <div style="text-align: center; color: #777; font-size: 12px;">
                <p>这是系统自动发送的邮件，请勿直接回复。</p>
                <p>如果您不想再收到此类报告，可以在应用设置中关闭周报功能。</p>
                <p>&copy; ${new Date().getFullYear()} Hello Word 单词学习应用. 保留所有权利。</p>
            </div>
        </div>
    `;

    return sendHtmlEmail(to, subject, html);
}

/**
 * 通用邮件发送函数
 * @param {Object} options - 邮件选项
 * @param {string} options.to - 收件人邮箱
 * @param {string} options.subject - 邮件主题
 * @param {string} options.text - 纯文本内容
 * @param {string} options.html - HTML内容 (可选)
 * @returns {Promise}
 */
async function sendEmail(options) {
    if (!transporter) {
        throw new Error('邮件服务未初始化');
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Hello Word <no-reply@helloword.app>',
        to: options.to,
        subject: options.subject,
        text: options.text
    };

    if (options.html) {
        mailOptions.html = options.html;
    }

    return transporter.sendMail(mailOptions);
}

module.exports = {
    initEmailService,
    sendEmail,
    sendTextEmail,
    sendHtmlEmail,
    sendEmailWithAttachments,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendLearningReminderEmail,
    sendWeeklyReportEmail
};