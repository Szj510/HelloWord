import React, { useState } from 'react';
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
import PaletteIcon from '@mui/icons-material/Palette';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CssBaseline from '@mui/material/CssBaseline';

// 引入自定义主题
import { getActiveTheme, blueGrayColors, earthToneColors, greenBeigeColors } from './theme/themeConfig';
import { ThemeProvider, useTheme, COLOR_SCHEMES, THEME_MODES } from './context/ThemeContext';

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
import VerifyCodePage from './pages/VerifyCodePage';
import PlanSettingsPage from './pages/PlanSettingsPage';
import NotebookPage from './pages/NotebookPage';
import VocabularyTestPage from './pages/VocabularyTestPage';
import VocabularyTestHistoryPage from './pages/VocabularyTestHistoryPage';

// 引入私有路由组件 和 Auth Context
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

// Navbar 组件
const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { colorScheme, changeColorScheme, COLOR_SCHEMES, themeMode, toggleThemeMode, THEME_MODES } = useTheme();
  const navigate = useNavigate();
  
  // 配色方案切换菜单
  const [themeAnchorEl, setThemeAnchorEl] = useState(null);
  const themeMenuOpen = Boolean(themeAnchorEl);
  
  const handleThemeMenuOpen = (event) => {
    setThemeAnchorEl(event.currentTarget);
  };
  
  const handleThemeMenuClose = () => {
    setThemeAnchorEl(null);
  };
  
  const handleThemeChange = (scheme) => {
    changeColorScheme(scheme);
    handleThemeMenuClose();
  };

  // 根据当前主题配色选择颜色
  const colors = () => {
    switch (colorScheme) {
      case COLOR_SCHEMES.BLUE_GRAY:
        return blueGrayColors;
      case COLOR_SCHEMES.GREEN_BEIGE:
        return greenBeigeColors;
      default:
        return earthToneColors;
    }
  };

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
        background: themeMode === THEME_MODES.DARK ? 
          'rgba(30, 30, 30, 0.85)' : 
          'rgba(255, 255, 255, 0.85)',
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
            color: colors().text,
          }}
        >
          HelloWord
        </Typography>

        <IconButton
          onClick={toggleThemeMode}
          color="inherit"
          sx={{
            mr: 1,
            color: colors().accent,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(180deg)'
            }
          }}
          aria-label="切换暗色/亮色模式"
        >
          {themeMode === THEME_MODES.DARK ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </IconButton>

        <IconButton
          onClick={handleThemeMenuOpen}
          color="inherit"
          sx={{
            mr: 2,
            color: colors().accent,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(30deg)'
            }
          }}
          aria-label="切换配色方案"
          aria-controls="theme-menu"
          aria-haspopup="true"
          aria-expanded={themeMenuOpen ? 'true' : undefined}
        >
          <PaletteIcon />
        </IconButton>
        
        {/* 配色方案菜单 */}
        <Menu
          id="theme-menu"
          anchorEl={themeAnchorEl}
          open={themeMenuOpen}
          onClose={handleThemeMenuClose}
          MenuListProps={{
            'aria-labelledby': 'theme-button',
          }}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <MenuItem 
            onClick={() => handleThemeChange(COLOR_SCHEMES.EARTH_TONE)}
            selected={colorScheme === COLOR_SCHEMES.EARTH_TONE}
            sx={{ 
              minWidth: '160px',
              '&:hover': { backgroundColor: 'rgba(166, 124, 82, 0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(45deg, #A67C52, #F3E9DD)',
                  mr: 1.5,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }} 
              />
              奶茶色系
            </Box>
          </MenuItem>
          <MenuItem 
            onClick={() => handleThemeChange(COLOR_SCHEMES.BLUE_GRAY)}
            selected={colorScheme === COLOR_SCHEMES.BLUE_GRAY}
            sx={{ 
              minWidth: '160px',
              '&:hover': { backgroundColor: 'rgba(91, 108, 140, 0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(45deg, #404859, #6C7C99)',
                  mr: 1.5,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }} 
              />
              蓝灰色系
            </Box>
          </MenuItem>
          <MenuItem 
            onClick={() => handleThemeChange(COLOR_SCHEMES.GREEN_BEIGE)}
            selected={colorScheme === COLOR_SCHEMES.GREEN_BEIGE}
            sx={{ 
              minWidth: '160px',
              '&:hover': { backgroundColor: 'rgba(106, 141, 109, 0.1)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(45deg, #57744A, #FFFBEB)',
                  mr: 1.5,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }} 
              />
              绿米色系
            </Box>
          </MenuItem>
        </Menu>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', gap: 1 }} className="animate-fade-in">
            <Button
              component={Link}
              to="/home"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              学习计划
            </Button>
            <Button
              component={Link}
              to="/vocabulary-test"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              词汇量测试
            </Button>
            <Button
              component={Link}
              to="/vocabulary-test-history"
              className="nav-link"
              sx={{
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              词汇量测试历史
            </Button>
            <Button
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                border: `1px solid rgba(${hexToRgb(colors().accent)}, 0.5)`,
                color: colors().accent,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
                  borderColor: colors().accent,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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
                color: colors().accent,
                '&:hover': {
                  backgroundColor: `rgba(${hexToRgb(colors().accent)}, 0.1)`,
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

// 页脚组件
const Footer = () => {
  const { colorScheme } = useTheme();
  const currentTheme = getActiveTheme(colorScheme);
  const themeColors = currentTheme.palette.colorScheme;
  
  return (
    <Box 
      component="footer" 
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'transparent',
        borderTop: `1px solid ${themeColors.border}`,
        textAlign: 'center'
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color={themeColors.secondaryText}>
          Hello Word App - Version 3.0 &copy; {new Date().getFullYear()}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Typography variant="caption" color={themeColors.secondaryText}>
            智能英语单词学习应用
          </Typography>
          <Typography variant="caption" color={themeColors.secondaryText} component="a" href="https://github.com/Szj510/HelloWord" sx={{ textDecoration: 'none', color: 'inherit' }}>
            GitHub
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

// 辅助函数: 将十六进制颜色转换为RGB格式
const hexToRgb = (hex) => {
  // 移除可能的#前缀
  hex = hex.replace('#', '');
  
  // 将短格式转为长格式 如 #abc 转为 #aabbcc
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // 提取RGB值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

// 与主题相关的应用包装器
const ThemedApp = () => {
  const { colorScheme } = useTheme();
  const currentTheme = getActiveTheme(colorScheme);

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
            <Route path="/verify-code" element={<VerifyCodePage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/wordbooks" element={<WordbooksPage />} />
              <Route path="/wordbooks/:id" element={<WordbookDetailPage />} />
              <Route path="/learn/:wordbookId" element={<LearningPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/plan-settings" element={<PlanSettingsPage />} />
              <Route path="/notebook" element={<NotebookPage />} />
              <Route path="/vocabulary-test" element={<VocabularyTestPage />} />
              <Route path="/vocabulary-test/:testId" element={<VocabularyTestPage />} />
              <Route path="/vocabulary-test-history" element={<VocabularyTestHistoryPage />} />
            </Route>
          </Routes>
        </Container>
        <Footer />
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