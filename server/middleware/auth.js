const jwt = require('jsonwebtoken');
require('dotenv').config(); // 使用默认路径加载 .env

module.exports = function(req, res, next) {
  // 1. 从请求头获取 token
  const authHeader = req.header('Authorization'); // 'Bearer TOKEN'

  // 2. 检查 token 是否存在
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: '无有效 Token，授权被拒绝' });
  }

  // 提取 Token 部分
  const token = authHeader.split(' ')[1];
  if (!token) {
      return res.status(401).json({ msg: 'Token 格式错误，授权被拒绝' });
  }


  try {
    console.log('验证Token...');
    console.log('JWT_SECRET是否设置:', process.env.JWT_SECRET ? '已设置' : '未设置');

    // 3. 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token验证成功，解码结果:', decoded);

    // 4. 将解码后的用户信息（特别是 user id）附加到请求对象上
    req.user = decoded.user; // 我们在签发 token 时 payload 是 { user: { id: ... } }
    console.log('用户ID已附加到请求:', req.user.id);

    // 5. 调用下一个中间件或路由处理器
    next();
  } catch (err) {
    console.error('Token 验证失败:', err.message);
    console.error('错误详情:', err);
    res.status(401).json({ msg: 'Token 无效' });
  }
};