import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import './App.css';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CssBaseline from '@mui/material/CssBaseline';

// 引入自定义主题
import { lightTheme, darkTheme } from './theme/themeConfig';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// 引入页面组件
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import WordsPage from './pages/WordsPage';
import WordbooksPage from './pages/WordbooksPage';
import LearningPage from './pages/LearningPage';
import WordbookDetailPage from './pages/WordbookDetailPage';
import StatisticsPage from './pages/StatisticsPage';
import ReportsPage from './pages/ReportsPage';
import VerificationSuccessPage from './pages/VerificationSuccessPage';
import VerificationFailedPage from './pages/VerificationFailedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PlanSettingsPage from './pages/PlanSettingsPage';
import NotebookPage from './pages/NotebookPage';
// 引入私有路由组件 和 Auth Context
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

// Navbar 组件
const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      className="modern-navbar"
      sx={{
        marginBottom: 4,
        background: theme === 'light'
          ? 'rgba(255, 255, 255, 0.85)'
          : 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Toolbar>
        <Typography
          variant="h5"
          component={Link}
          to={isAuthenticated ? "/home" : "/"}
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            fontWeight: 'bold',
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
          className="animate-pulse"
        >
          HelloWord
        </Typography>

        <IconButton
          onClick={toggleTheme}
          color="inherit"
          sx={{
            mr: 2,
            color: theme === 'light' ? '#8E54E9' : '#4776E6',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(30deg)'
            }
          }}
          aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
        >
          {theme === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', gap: 1 }} className="animate-fade-in">
            <Button
              component={Link}
              to="/home"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              主页
            </Button>
            <Button
              component={Link}
              to="/words"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              单词列表
            </Button>
            <Button
              component={Link}
              to="/wordbooks"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              我的单词书
            </Button>
            <Button
              component={Link}
              to="/notebook"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              生词本
            </Button>
            <Button
              component={Link}
              to="/statistics"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              学习统计
            </Button>
            <Button
              component={Link}
              to="/reports"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              学习报告
            </Button>
            <Button
              component={Link}
              to="/plan-settings"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              学习计划
            </Button>
            <Button
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                border: '1px solid rgba(142, 84, 233, 0.5)',
                color: '#8E54E9',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(142, 84, 233, 0.1)',
                  borderColor: '#8E54E9',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              退出登录
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }} className="animate-fade-in">
            <Button
              component={Link}
              to="/login"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              登录
            </Button>
            <Button
              component={Link}
              to="/register"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              注册
            </Button>
            <Button
              component={Link}
              to="/words"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: '#4776E6',
                '&:hover': {
                  backgroundColor: 'rgba(71, 118, 230, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              单词列表
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

// 与主题相关的应用包装器
const ThemedApp = () => {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Container maxWidth="lg" className="App animate-fade-in" style={{ marginTop: '20px' }}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/words" element={<WordsPage />} />
            <Route path="/verification-success" element={<VerificationSuccessPage />} />
            <Route path="/verification-failed" element={<VerificationFailedPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/wordbooks" element={<WordbooksPage />} />
              <Route path="/wordbooks/:id" element={<WordbookDetailPage />} />
              <Route path="/learn/:wordbookId" element={<LearningPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/plan-settings" element={<PlanSettingsPage />} />
              <Route path="/notebook" element={<NotebookPage />} />
            </Route>
          </Routes>
        </Container>
      </Router>
    </MuiThemeProvider>
  );
};

// App 函数
function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;