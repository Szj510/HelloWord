const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users'); // <--- 引入用户路由
const wordbookRoutes = require('./routes/wordbooks');
const wordRoutes = require('./routes/words');
const learningRoutes = require('./routes/learning');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors()); // 允许跨域请求 (方便本地开发)
app.use(express.json({ extended: false })); // 解析 JSON 请求体

// 定义基础路由
app.get('/', (req, res) => res.send('HelloWord API Running'));

// 使用 API 路由
app.use('/api/auth', authRoutes); // 将所有 /api/auth 开头的请求交给 authRoutes 处理
app.use('/api/users', userRoutes);
app.use('/api/wordbooks', wordbookRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api', require('./routes/api')); // 保留之前的 /api/hello 路由

// 启动服务器
const PORT = process.env.PORT || 5001; // 使用 .env 或默认 5001
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));