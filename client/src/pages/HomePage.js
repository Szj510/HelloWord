import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 引入 useAuth Hook

// 引入 MUI 组件
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress'; // 用于显示加载状态
import Alert from '@mui/material/Alert'; // 用于显示可能的错误

function HomePage() {
  // 从 AuthContext 获取状态和函数
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // 处理退出登录
  const handleLogout = () => {
    logout();
    navigate('/login'); // 跳转到登录页
  };

  // 处理加载状态
  if (isLoading) {
    // 如果 AuthContext 还在加载用户信息，显示加载指示器
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        marginTop: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* 根据是否存在 user 显示不同的欢迎信息 */}
      <Typography component="h1" variant="h4" gutterBottom>
        {user ? `欢迎, ${user.username || user.email}!` : '欢迎来到 HelloWord 主页'}
      </Typography>

      {/* 显示一些用户信息 (如果存在) */}
      {user && (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          当前登录用户: {user.email} (注册时间: {new Date(user.registerDate).toLocaleDateString()})
        </Alert>
      )}

      <Typography variant="body1" paragraph>
        这里将是你开始单词学习的地方！(内容待添加)
      </Typography>

      {/* 后续功能区占位 */}
      <Box sx={{ marginTop: 3, textAlign: 'left', width: '80%', maxWidth: '600px' }}>
         <Typography variant="h6">后续功能区 (占位):</Typography>
         <ul>
           <li>今日学习任务 (基于 AI 推荐)</li>
           <li>选择/管理单词书</li>
           <li>查看学习统计图表</li>
           <li>用户设置</li>
         </ul>
       </Box>


      <Button
        variant="contained"
        color="secondary"
        onClick={handleLogout}
        sx={{ marginTop: 4 }}
      >
        退出登录
      </Button>
    </Box>
  );
}

export default HomePage;