/**
 * 初始化用户单词书脚本
 * 
 * 这个脚本用于为用户初始化默认单词书，解决单词分布统计为0的问题
 * 当新用户注册或未导入任何单词书时，系统会自动导入几个默认的单词书
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Word = require('../models/Word');
const WordBook = require('../models/WordBook');
const User = require('../models/User');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 默认导入的词典标签
const DEFAULT_DICTIONARY_TAGS = ['CET4', 'IELTS', '4000EEW_Meaning'];

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
};

// 为指定用户导入默认单词书
async function importDefaultWordbooks(userId) {
  try {
    console.log(`为用户 ${userId} 导入默认单词书`);
    
    // 对每个默认标签创建单词书
    for (const tag of DEFAULT_DICTIONARY_TAGS) {
      // 查找具有此标签的所有单词
      const words = await Word.find({ tags: tag }).select('_id').lean();
      
      if (words.length === 0) {
        console.log(`没有找到标签为 ${tag} 的单词，跳过`);
        continue;
      }
      
      // 设置单词书名称和描述
      let name, description, level, category;
      
      switch (tag) {
        case 'CET4':
          name = '四级核心词汇';
          description = '大学英语四级考试必备词汇';
          level = 'CET4';
          category = '考试';
          break;
        case 'IELTS':
          name = '雅思词汇';
          description = '雅思考试常用词汇';
          level = 'IELTS';
          category = '留学';
          break;
        case '4000EEW_Meaning':
          name = '4000基本英语词汇';
          description = '日常交流必备的4000个核心英语词汇';
          level = 'Basic';
          category = '日常';
          break;
        default:
          name = `${tag}词汇`;
          description = `标签为${tag}的词汇集合`;
          level = tag;
          category = '其他';
      }
      
      // 提取单词ID
      const wordIds = words.map(w => w._id);
      
      // 检查用户是否已经有同名的单词书
      const existingWordbook = await WordBook.findOne({ 
        owner: userId, 
        name: name 
      });
      
      if (existingWordbook) {
        console.log(`用户已有单词书: ${name}，跳过`);
        continue;
      }
      
      // 创建新的单词书
      const newWordbook = new WordBook({
        name,
        description,
        level,
        category,
        owner: userId,
        words: wordIds,
        isPublic: false
      });
      
      // 保存单词书
      await newWordbook.save();
      console.log(`成功为用户 ${userId} 创建单词书: ${name}，包含 ${wordIds.length} 个单词`);
    }
    
    console.log(`用户 ${userId} 默认单词书导入完成`);
    return true;
  } catch (err) {
    console.error(`为用户 ${userId} 导入默认单词书失败:`, err.message);
    return false;
  }
}

// 为所有没有单词书的用户导入默认单词书
async function importForAllUsers() {
  try {
    await connectDB();
    
    // 查找所有用户
    const users = await User.find().select('_id').lean();
    console.log(`找到 ${users.length} 个用户`);
    
    // 为每个用户检查是否有单词书
    for (const user of users) {
      const userId = user._id;
      
      // 检查用户是否已有单词书
      const wordbooksCount = await WordBook.countDocuments({ owner: userId });
      
      if (wordbooksCount === 0) {
        console.log(`用户 ${userId} 没有单词书，正在导入默认单词书...`);
        await importDefaultWordbooks(userId);
      } else {
        console.log(`用户 ${userId} 已有 ${wordbooksCount} 个单词书，跳过`);
      }
    }
    
    console.log('所有用户处理完成');
    mongoose.disconnect();
  } catch (err) {
    console.error('处理用户时出错:', err.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

// 可以导出为模块供其他文件使用
module.exports = {
  importDefaultWordbooks,
  importForAllUsers
};

// 如果直接运行此脚本，则为所有用户导入默认单词书
if (require.main === module) {
  importForAllUsers();
}