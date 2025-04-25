# Hello Word 应用 (Version 1.0)

一个帮助用户学习和记忆英语单词的应用程序。

## 功能介绍

Hello Word 应用目前提供以下功能：

- **用户认证系统**

  - 用户注册
  - 用户登录
  - 基于 token 的身份验证

- **单词本管理**

  - 浏览所有可用的单词本
  - 查看单词本详情
  - 包含多种预设单词本（考研、四六级、雅思等）

- **单词学习**

  - 浏览单词列表
  - 学习记录跟踪
  - 个性化学习页面

- **支持的单词本**
  - 2025 考研红宝书
  - 4000 基本英语词汇（含释义和例句）
  - 四级词汇
  - 六级词汇
  - 高考 3500 词
  - 2026 红宝书
  - 雅思词汇（有序和无序版本）
  - 2024 考研词汇
  - 专项词汇

## 技术栈

### 前端

- React.js
- Context API (用于状态管理)
- React Router (用于页面路由)
- CSS

### 后端

- Node.js
- Express.js
- MongoDB
- JSON Web Tokens (JWT)

## 本地部署指南

### 前提条件

- Node.js (v14.0.0 或更高版本)
- npm (v6.0.0 或更高版本)
- MongoDB (v4.0 或更高版本)

### 步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/Szj510/hello-word-app.git
cd hello-word-app
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

创建一个 `.env` 文件在 client 目录中，包含以下配置：

```
REACT_APP_API_URL=http://localhost:5000/api
```

启动前端开发服务器：

```bash
npm start
```

#### 4. 访问应用

打开浏览器，访问 `http://localhost:3000`，即可使用 Hello Word 应用。

## 贡献指南

如果您想为该项目做出贡献，请遵循以下步骤：

1. Fork 该仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

该项目采用 [MIT 许可证](LICENSE)。
