import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import './App.css';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// 引入页面组件
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import WordsPage from './pages/WordsPage';
import WordbooksPage from './pages/WordbooksPage'; // <--- 引入 WordbooksPage
import LearningPage from './pages/LearningPage';
import WordbookDetailPage from './pages/WordbookDetailPage'; 
import StatisticsPage from './pages/StatisticsPage';
import ReportsPage from './pages/ReportsPage';
import VerificationSuccessPage from './pages/VerificationSuccessPage';
import VerificationFailedPage from './pages/VerificationFailedPage';
import VerifyEmailPage from './pages/VerifyEmailPage'; // <--- 导入新的验证邮箱页面
import PlanSettingsPage from './pages/PlanSettingsPage';
// 引入私有路由组件 和 Auth Context
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

// Navbar 组件
const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ marginBottom: 2 }}>
      <Toolbar>
        <Typography variant="h6" component={Link} to={isAuthenticated ? "/home" : "/"} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          HelloWord
        </Typography>
        {isAuthenticated ? (
          <Box>
            <Button color="inherit" component={Link} to="/home">主页</Button>
            <Button color="inherit" component={Link} to="/words">单词列表</Button>
            {/* V--- 添加到“我的单词书”页面的链接 ---V */}
            <Button color="inherit" component={Link} to="/wordbooks">我的单词书</Button>
            <Button color="inherit" component={Link} to="/statistics">学习统计</Button>
            <Button color="inherit" component={Link} to="/reports">学习报告</Button>
            <Button color="inherit" component={Link} to="/plan-settings">学习计划</Button>
            <Button color="inherit" onClick={handleLogout}>退出登录</Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">登录</Button>
            <Button color="inherit" component={Link} to="/register">注册</Button>
             {/* 未登录时也可以查看单词列表 */}
            <Button color="inherit" component={Link} to="/words">单词列表</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

// App 函数
function App() {
  return (
    <Router>
      <Navbar />
      <Container maxWidth="lg" className="App" style={{ marginTop: '20px' }}>
        <Routes>
          {/* ... 公开路由 ... */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/words" element={<WordsPage />} />
          <Route path="/verification-success" element={<VerificationSuccessPage />} />
          <Route path="/verification-failed" element={<VerificationFailedPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

          {/* 私有/受保护路由 */}
          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/wordbooks" element={<WordbooksPage />} />
            <Route path="/wordbooks/:id" element={<WordbookDetailPage />} />
            <Route path="/learn/:wordbookId" element={<LearningPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/plan-settings" element={<PlanSettingsPage />} />
          </Route>

        </Routes>
      </Container>
    </Router>
  );
}

export default App;