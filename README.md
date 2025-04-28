# Hello Word 应用 (Version 2.0)

一个智能化的英语单词学习记忆应用程序，帮助用户高效地掌握英语词汇。

## 最新功能亮点

Hello Word 2.0 版本带来了以下重要更新：

- **邮箱验证系统**：增加邮箱验证功能，提升账户安全性
- **个性化学习计划**：支持设置每日学习目标和计划结束日期
- **智能复习算法**：基于记忆曲线优化复习时间间隔
- **多种学习模式**：支持闪卡模式和拼写模式
- **学习数据统计**：提供详细的学习进度和薄弱点分析
- **周报告系统**：自动生成周学习报告和个性化建议

## 版本历史与切换

Hello Word 应用的主要版本演进：

- **Version 2.0** (当前版本 - 提交 cd07bc4)：完整功能集，包含邮箱验证、学习计划、统计分析和周报告
- **Version 1.0** (提交 f290461)：基础功能版本，包含用户认证、单词本管理和简单学习功能

如需切换到 Version 1.0 版本，可使用以下 git 命令：

```bash
# 克隆仓库（如果尚未克隆）
git clone https://github.com/Szj510/HelloWord.git
cd HelloWord

# 切换到Version 1.0版本
git checkout f290461
```

切换版本后，请按照该版本 README 中的说明重新安装依赖并启动应用。

## 完整功能介绍

### 用户认证系统

- **用户注册与登录**：支持邮箱注册和登录
- **邮箱验证**：注册后需验证邮箱以激活账户
- **基于 token 的身份验证**：安全的 JWT 认证机制
- **密码安全**：密码加密存储，确保用户信息安全

### 单词本管理

- **浏览所有可用的单词本**：支持查看系统预设和个人单词本
- **查看单词本详情**：包含单词数量、学习进度统计
- **多种预设单词本**：包含多种考试词汇和分级词汇
- **单词本学习状态跟踪**：记录每本单词书的学习进度

### 单词学习系统

- **多模式学习**：
  - 闪卡模式：传统记忆模式，自我评估认识程度
  - 拼写模式：输入单词拼写，系统自动判断正误
- **智能学习会话**：
  - 自动混合安排新词学习和复习任务
  - 根据个人学习计划调整每日学习量
- **学习状态追踪**：
  - 记录单词的学习状态：新词、学习中、复习中、已掌握
  - 追踪每个单词的正确率和连续正确次数
  - 智能调整每个单词的下次复习时间

### 个性化学习计划

- **设置学习目标**：自定义每日新词和复习量
- **目标日期**：设定学习计划的结束日期
- **智能建议**：根据剩余单词量自动推荐合理的学习计划
- **计划管理**：可随时调整或停用学习计划

### 学习数据统计与分析

- **学习概览**：展示已学单词数、已掌握单词数、学习天数、总体正确率
- **进度追踪**：显示近期学习次数的变化趋势图
- **薄弱点分析**：识别错误率高的单词，提供针对性复习
- **周报告**：自动生成每周学习总结和改进建议

### 支持的单词本

- **2025 考研红宝书**
- **4000 基本英语词汇**（含释义和例句）
- **四级词汇**
- **六级词汇**
- **高考 3500 词**
- **2026 红宝书**
- **雅思词汇**（有序和无序版本）
- **2024 考研词汇**
- **专项词汇**

## 技术栈

### 前端

- **React.js**：用于构建用户界面
- **Material UI**：UI 组件库，提供美观的用户界面
- **Context API**：用于状态管理
- **React Router**：用于页面路由
- **Recharts**：用于数据可视化
- **Day.js**：处理日期和时间

### 后端

- **Node.js**：JavaScript 运行环境
- **Express.js**：Web 应用框架
- **MongoDB**：NoSQL 数据库
- **Mongoose**：MongoDB 对象模型工具
- **JSON Web Tokens (JWT)**：用于身份验证
- **Bcrypt.js**：密码加密
- **Nodemailer**：发送验证邮件

## 本地部署指南

### 前提条件

- Node.js (v14.0.0 或更高版本)
- npm (v6.0.0 或更高版本)
- MongoDB (v4.0 或更高版本)
- SMTP 服务器（用于发送验证邮件）

### 部署步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/Szj510/HelloWord.git
cd HelloWord
```

#### 2. 设置后端

```bash
cd server
npm install
```

创建一个 `.env` 文件在 server 目录中，包含以下配置：

```
MONGO_URI=mongodb://localhost:27017/helloword
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000

# 邮件服务配置
EMAIL_SERVICE=gmail  # 或其他SMTP服务
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password
EMAIL_FROM="Hello Word App <your_email@example.com>"
```

初始化数据库：

```bash
node seed/seedWords.js
```

启动后端服务器：

```bash
npm start
```

#### 3. 设置前端

```bash
cd ../client
npm install
```

创建一个 `.env` 文件在 client 目录中：

```
REACT_APP_API_URL=http://localhost:5000/api
```

启动前端开发服务器：

```bash
npm start
```

#### 4. 访问应用

打开浏览器，访问 `http://localhost:3000`，即可使用 Hello Word 应用。

## 使用指南

### 新用户入门

1. **注册账号**：使用有效邮箱注册账号
2. **验证邮箱**：点击邮件中的验证链接激活账户
3. **登录应用**：使用已验证的邮箱和密码登录
4. **设置学习计划**：在"学习计划"页面选择目标单词书并设置每日学习目标
5. **开始学习**：在主页点击"开始学习"或"开始复习"

### 日常使用流程

1. **学习新词**：每天完成设定的新词学习目标
2. **复习旧词**：定期复习系统推荐的待复习单词
3. **检查统计**：查看"统计"页面了解学习进度和薄弱点
4. **调整计划**：根据学习情况适时调整学习计划

## 贡献指南

如果您想为该项目做出贡献，请遵循以下步骤：

1. Fork 该仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

该项目采用 [MIT 许可证](LICENSE)。

## 联系我们

如有问题或建议，请通过以下方式联系我们：

- 项目 GitHub: [https://github.com/Szj510/HelloWord](https://github.com/Szj510/HelloWord)
- 电子邮件: 20232131041@m.scnu.edu.cn

---

**Hello Word App** - 让单词学习更高效、更智能 © 2025
