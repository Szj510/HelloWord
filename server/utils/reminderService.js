const User = require('../models/User');
const sendEmail = require('./emailSender');
const cron = require('node-cron');

// 用于存储任务调度
const scheduledTasks = new Map();

/**
 * 启动提醒服务
 */
const startReminderService = () => {
  console.log('启动学习提醒服务...');
  
  // 每分钟检查一次，看是否需要发送提醒
  // 在实际生产环境中可能需要优化此逻辑，但对于演示目的，这是一种简单的方法
  cron.schedule('* * * * *', async () => {
    try {
      // 获取当前时间
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // 查找所有启用了提醒功能，且提醒时间是当前时间的活跃计划
      const users = await User.find({
        'plans': {
          $elemMatch: {
            'isActive': true,
            'reminderEnabled': true,
            'reminderTime': timeString
          }
        }
      }).select('email plans');
      
      // 为每个匹配的用户发送提醒邮件
      for (const user of users) {
        const activePlan = user.plans.find(plan => plan.isActive);
        if (activePlan) {
          await sendLearningReminder(user.email, activePlan);
        }
      }
    } catch (err) {
      console.error('执行学习提醒任务出错:', err);
    }
  });

  console.log('学习提醒服务已启动');
};

/**
 * 发送学习提醒邮件
 * @param {string} email - 用户邮箱
 * @param {Object} plan - 学习计划对象
 */
const sendLearningReminder = async (email, plan) => {
  try {
    const subject = '您的每日单词学习提醒';
    const text = `亲爱的用户，
    
现在是您设定的学习时间！
今天的学习目标是:
- 学习 ${plan.dailyNewWordsTarget} 个新单词
- 复习 ${plan.dailyReviewWordsTarget} 个单词

坚持学习，每天进步！

此致，
HelloWord 团队`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4776E6;">您的每日单词学习提醒</h2>
      <p>亲爱的用户，</p>
      <p>现在是您设定的学习时间！</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #8E54E9;">今天的学习目标是:</h3>
        <ul>
          <li>学习 <strong>${plan.dailyNewWordsTarget}</strong> 个新单词</li>
          <li>复习 <strong>${plan.dailyReviewWordsTarget}</strong> 个单词</li>
        </ul>
      </div>
      <p>坚持学习，每天进步！</p>
      <p>此致，<br>HelloWord 团队</p>
      <div style="margin-top: 30px; font-size: 12px; color: #888;">
        <p>如需关闭提醒，请在应用中修改学习计划设置。</p>
      </div>
    </div>`;

    await sendEmail({
      to: email,
      subject,
      text,
      html
    });
    
    console.log(`已向 ${email} 发送学习提醒`);
  } catch (err) {
    console.error(`向 ${email} 发送学习提醒失败:`, err);
  }
};

module.exports = {
  startReminderService
};