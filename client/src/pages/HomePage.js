import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // 使用 RouterLink
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';
import apiFetch from '../utils/api';

// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid'; // 使用 Grid 布局
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions'; // 卡片操作区域
import Paper from '@mui/material/Paper'; // 添加Paper组件

// 辅助函数：将十六进制颜色转换为RGB
const hexToRgb = (hex) => {
  // 移除可能的#前缀
  hex = hex.replace('#', '');
  
  // 解析RGB值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

// --- 自定义StatCard组件，添加动画和效果 ---
const StatCard = ({ title, value, unit = '', icon = null, animationDelay = 0, themeColors }) => (
    <Card 
        className="card-glass hover-lift animate-fade-in" 
        sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 2, 
            height: '100%',
            animation: `fadeIn 0.5s ease-out ${animationDelay}s forwards`,
            opacity: 0,
            transform: 'translateY(20px)',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: themeColors.light,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: `linear-gradient(90deg, ${themeColors.secondary}, ${themeColors.accent})`,
            }
        }}
    >
        {icon && <Box sx={{ mr: 2, color: themeColors.accent }}>{icon}</Box>}
        <Box>
            <Typography color={themeColors.text} sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{title}</Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: themeColors.accent }}>
                {value}{unit}
            </Typography>
        </Box>
    </Card>
);

function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // 获取当前主题和配色方案
    const { colorScheme } = useTheme();
    
    // 根据当前主题选择配色方案
    const getThemeColors = () => {
        switch(colorScheme) {
            case COLOR_SCHEMES.BLUE_GRAY:
                return blueGrayColors;
            case COLOR_SCHEMES.GREEN_BEIGE:
                return greenBeigeColors;
            case COLOR_SCHEMES.EARTH_TONE:
            default:
                return earthToneColors;
        }
    };
    
    // 当前主题的颜色
    const themeColors = getThemeColors();

    const [overviewStats, setOverviewStats] = useState(null);
    const [dueReviewCount, setDueReviewCount] = useState(0);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingDue, setLoadingDue] = useState(true);
    const [errorStats, setErrorStats] = useState('');
    const [errorDue, setErrorDue] = useState('');
    const [currentPlan, setCurrentPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(true); 
    const [refreshCounter, setRefreshCounter] = useState(0); // 添加刷新计数器，用于触发重新获取待复习数据
    const refreshTimerRef = useRef(null); // 添加定时器引用，用于管理定时器

    // 获取概览统计
    useEffect(() => {
        const fetchOverview = async () => {
            setLoadingStats(true);
            setErrorStats('');
            try {
                const data = await apiFetch('/api/statistics/overview');
                setOverviewStats(data);
            } catch (err) { setErrorStats(`获取概览数据失败: ${err.message}`); }
            finally { setLoadingStats(false); }
        };
        fetchOverview();
    }, []); // 加载一次

    // 封装获取待复习数量的函数，便于重复调用
    const fetchDueWords = useCallback(async () => {
        setLoadingDue(true);
        setErrorDue('');
        try {
            const data = await apiFetch('/api/learning/due');
            setDueReviewCount(data?.dueReviewCount || 0);
            console.log(`已更新待复习单词数量: ${data?.dueReviewCount || 0}`);
        } catch (err) { 
            setErrorDue(`获取待复习数量失败: ${err.message}`);
        } finally { 
            setLoadingDue(false); 
        }
    }, []);

    // 获取待复习数量 - 依赖refreshCounter，当其变化时重新获取数据
    useEffect(() => {
        fetchDueWords();
    }, [fetchDueWords, refreshCounter]); 

    // 添加定期刷新逻辑与页面焦点变化时的刷新
    useEffect(() => {
        // 每30秒刷新一次待复习单词数量（原来是60秒）
        refreshTimerRef.current = setInterval(() => {
            fetchDueWords();
        }, 30000); 
        
        // 页面可见性变化时也刷新数据
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchDueWords();
            }
        };
        
        // 路由变化时刷新数据
        const handleRouteChange = () => {
            fetchDueWords();
        };
        
        // 添加事件监听
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('popstate', handleRouteChange);
        
        // 清理函数
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [fetchDueWords]);

    useEffect(() => {
        const fetchCurrentPlan = async () => {
            setLoadingPlan(true);
            try {
                // 尝试获取活动计划
                const data = await apiFetch('/api/plans/current');
                if (data.plan) {
                    setCurrentPlan(data.plan);
                } else {
                    // 如果没有活动计划，检查是否有旧格式的计划
                    const userData = await apiFetch('/api/users/me');
                    if (userData && userData.learningPlan && userData.learningPlan.isActive) {
                        setCurrentPlan(userData.learningPlan);
                    } else {
                        setCurrentPlan(null);
                    }
                }
            } catch (err) {
                console.error("获取当前计划失败:", err);
                // 这里可以选择不设置全局错误，因为主页其他部分可能正常
            } finally {
                setLoadingPlan(false);
            }
        };
        fetchCurrentPlan();
    }, []);
    
    const handleLogout = () => { 
        logout();
        navigate('/login');
    };

    // 跳转到复习页面
    const handleStartReview = () => {
        if (currentPlan && currentPlan.targetWordbook) {
            // 移除 onComplete 回调函数，避免 DataCloneError
            navigate(`/learn/${currentPlan.targetWordbook}`, { 
                state: { 
                    mode: 'review', // 明确指定为复习模式
                    reviewLimit: currentPlan.dailyReviewWordsTarget
                } 
            });
        } else {
            navigate('/wordbooks');
        }
    };

    // 跳转到学习新单词页面
    const handleStartLearning = () => {
        if (currentPlan && currentPlan.targetWordbook) {
            // 移除 onComplete 回调函数，避免 DataCloneError
            navigate(`/learn/${currentPlan.targetWordbook}`, { 
                state: { 
                    mode: 'learn',
                    newLimit: currentPlan.dailyNewWordsTarget
                } 
            });
        } else {
            navigate('/wordbooks');
        }
    };

    // 添加自定义事件监听，用于学习页面完成后更新数据
    useEffect(() => {
        // 定义事件处理函数
        const handleLearningComplete = () => {
            // 立即更新待复习单词数量
            setRefreshCounter(prev => prev + 1);
            console.log("学习完成，通过事件更新待复习单词数量");
        };

        // 添加事件监听
        window.addEventListener('learning-complete', handleLearningComplete);

        // 清理函数
        return () => {
            window.removeEventListener('learning-complete', handleLearningComplete);
        };
    }, []);

    return (
        <Container maxWidth="lg">
            <Typography 
                component="h1" 
                variant="h3" 
                gutterBottom 
                sx={{ 
                    mt: 4, 
                    mb: 4, 
                    textAlign: 'center',
                    position: 'relative',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    display: 'inline-block',
                    color: themeColors.accent,
                }}
                className="animate-fade-in"
            >
                {user ? `欢迎回来, ${user.username || user.email}!` : '主页'}
            </Typography>

            <Box 
                sx={{ 
                    position: 'relative', 
                    padding: '2rem',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    mb: 6,
                    backgroundColor: themeColors.primary,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(120deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))`,
                        zIndex: -1
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 80%)',
                        transform: 'rotate(30deg)',
                        zIndex: -1
                    }
                }}
                className="glass animate-fade-in"
            >
                <Grid container spacing={4}>

                    {/* 学习任务卡片 */}
                    <Grid item xs={12} md={6}>
                        <Card 
                            elevation={0} 
                            className="card-neumorphic" 
                            sx={{ 
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                backgroundColor: `${themeColors.light} !important`, // 添加!important确保样式不被覆盖
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: `0 15px 30px rgba(${hexToRgb(themeColors.accent)}, 0.1)`
                                }
                            }}
                            component={Paper} // 显式指定为Paper组件
                        >
                            <Box 
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '5px',
                                    background: `linear-gradient(90deg, ${themeColors.secondary}, ${themeColors.tertiary})`,
                                }}
                            />
                            <CardContent>
                                <Typography 
                                    variant="h5" 
                                    gutterBottom 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        fontWeight: 'bold',
                                        color: themeColors.accent,
                                        mb: 3
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            mr: 1.5, 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.secondary)}, 0.2), rgba(${hexToRgb(themeColors.accent)}, 0.2))`,
                                        }}
                                    >
                                        <span 
                                            role="img" 
                                            aria-label="task" 
                                            style={{ fontSize: '1.4rem' }}
                                        >
                                            📝
                                        </span>
                                    </Box>
                                    今日任务
                                </Typography>
                                {loadingPlan ? 
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <div className="spinner" />
                                    </Box> 
                                    : currentPlan && currentPlan.isActive ? (
                                    <Alert 
                                        severity="info" 
                                        sx={{
                                            mb: 3, 
                                            background: `rgba(${hexToRgb(themeColors.tertiary)}, 0.1)`,
                                            borderRadius: '12px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: `0 4px 15px rgba(${hexToRgb(themeColors.tertiary)}, 0.2)`
                                            },
                                            border: `1px dashed rgba(${hexToRgb(themeColors.tertiary)}, 0.3)`
                                        }} 
                                        icon={false}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <span role="img" aria-label="info" style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                                                ℹ️
                                            </span>
                                            <Typography sx={{ fontWeight: 500, fontSize: '1.05rem', color: themeColors.text }}>
                                                当前学习计划
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 4 }}>
                                            <Typography sx={{ fontWeight: 500, mb: 1, display: 'flex', alignItems: 'center', color: themeColors.text }}>
                                                <span style={{ color: themeColors.tertiary, marginRight: '8px' }}>•</span>
                                                每日新学: <span style={{ fontWeight: 'bold', marginLeft: '5px', color: themeColors.accent }}>{currentPlan.dailyNewWordsTarget}词</span>
                                            </Typography>
                                            <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', color: themeColors.text }}>
                                                <span style={{ color: themeColors.tertiary, marginRight: '8px' }}>•</span>
                                                每日复习: <span style={{ fontWeight: 'bold', marginLeft: '5px', color: themeColors.accent }}>{currentPlan.dailyReviewWordsTarget}词</span>
                                            </Typography>
                                        </Box>
                                        <Button 
                                            component={RouterLink} 
                                            to="/plan-settings" 
                                            size="small" 
                                            sx={{
                                                mt: 2,
                                                background: `linear-gradient(90deg, ${themeColors.secondary}, ${themeColors.accent})`,
                                                color: 'white',
                                                borderRadius: '20px',
                                                padding: '3px 15px',
                                                fontSize: '0.75rem',
                                                '&:hover': {
                                                    opacity: 0.9,
                                                    transform: 'translateY(-2px)'
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            修改计划
                                        </Button>
                                    </Alert>
                                ) : (
                                    <Alert 
                                        severity="warning" 
                                        sx={{
                                            mb: 3,
                                            background: `rgba(${hexToRgb(themeColors.accent)}, 0.1)`,
                                            borderRadius: '12px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: `0 4px 15px rgba(${hexToRgb(themeColors.accent)}, 0.2)`
                                            },
                                            border: `1px dashed rgba(${hexToRgb(themeColors.accent)}, 0.3)`
                                        }}
                                        icon={false}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <span role="img" aria-label="warning" style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                                                ⚠️
                                            </span>
                                            <Typography sx={{ fontWeight: 500, fontSize: '1.05rem', color: themeColors.text }}>
                                                未设置学习计划
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ pl: 4, mb: 1, color: themeColors.text }}>
                                            当前无学习计划，将使用默认设置。设置个人专属学习计划可以提高学习效率！
                                        </Typography>
                                        <Button 
                                            component={RouterLink} 
                                            to="/plan-settings" 
                                            size="small"
                                            sx={{
                                                mt: 1,
                                                background: `linear-gradient(90deg, ${themeColors.tertiary}, ${themeColors.accent})`,
                                                color: 'white',
                                                borderRadius: '20px',
                                                padding: '4px 16px',
                                                fontSize: '0.8rem',
                                                '&:hover': {
                                                    opacity: 0.9,
                                                    transform: 'translateY(-2px)'
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            设置计划
                                        </Button>
                                    </Alert>
                                )}
                                {loadingDue ? 
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <div className="spinner" />
                                    </Box> 
                                    : errorDue ? 
                                    <Alert severity="error" size="small">{errorDue}</Alert> 
                                    : (
                                    <Box 
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            mb: 3,
                                            p: 3,
                                            borderRadius: '16px',
                                            background: dueReviewCount > 0 
                                                ? `rgba(${hexToRgb(themeColors.secondary)}, 0.15)` 
                                                : `rgba(${hexToRgb(themeColors.tertiary)}, 0.1)`,
                                            border: dueReviewCount > 0
                                                ? `1px dashed rgba(${hexToRgb(themeColors.secondary)}, 0.5)`
                                                : `1px dashed rgba(${hexToRgb(themeColors.tertiary)}, 0.3)`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: `0 8px 25px rgba(${hexToRgb(themeColors.accent)}, 0.15)`
                                            }
                                        }} 
                                        className={dueReviewCount > 0 ? "animate-pulse-slow" : ""}
                                    >
                                        <Box 
                                            sx={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                background: dueReviewCount > 0 
                                                    ? `linear-gradient(135deg, rgba(${hexToRgb(themeColors.secondary)}, 0.3), rgba(${hexToRgb(themeColors.accent)}, 0.3))`
                                                    : `linear-gradient(135deg, rgba(${hexToRgb(themeColors.accent)}, 0.2), rgba(${hexToRgb(themeColors.secondary)}, 0.2))`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2,
                                                flexShrink: 0
                                            }}
                                        >
                                            <span 
                                                role="img" 
                                                aria-label="notification"
                                                style={{ 
                                                    fontSize: '1.8rem',
                                                    opacity: dueReviewCount > 0 ? 1 : 0.8
                                                }}
                                            >
                                                {dueReviewCount > 0 ? '🔔' : '✅'}
                                            </span>
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5, color: themeColors.text }}>
                                                {dueReviewCount > 0 ? '复习提醒' : '已完成今日复习'}
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: themeColors.text }}>
                                                {dueReviewCount > 0 
                                                    ? <>当前有 <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: themeColors.accent }}>{dueReviewCount}</span> 个单词需要复习</>
                                                    : '太棒了！你已完成所有待复习的单词'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                                <Button
                                    size="large"
                                    sx={{
                                        mr: 2,
                                        background: `linear-gradient(90deg, ${themeColors.tertiary}, ${themeColors.secondary})`,
                                        color: 'white',
                                        borderRadius: '30px',
                                        padding: '10px 30px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: `0 4px 15px rgba(${hexToRgb(themeColors.secondary)}, 0.3)`,
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: `0 8px 25px rgba(${hexToRgb(themeColors.secondary)}, 0.5)`,
                                        },
                                        '&:active': {
                                            transform: 'translateY(1px)',
                                            boxShadow: `0 2px 8px rgba(${hexToRgb(themeColors.secondary)}, 0.3)`,
                                        },
                                        '&.Mui-disabled': {
                                            background: 'linear-gradient(90deg, #ccc, #ddd)',
                                            boxShadow: 'none'
                                        }
                                    }}
                                    onClick={handleStartLearning}
                                    disabled={loadingPlan || !currentPlan || !currentPlan.targetWordbook}
                                >
                                    开始学习
                                </Button>
                                <Button
                                    size="large"
                                    sx={{
                                        background: `linear-gradient(90deg, ${themeColors.secondary}, ${themeColors.accent})`,
                                        color: 'white',
                                        borderRadius: '30px',
                                        padding: '10px 30px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: `0 4px 15px rgba(${hexToRgb(themeColors.accent)}, 0.3)`,
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: `0 8px 25px rgba(${hexToRgb(themeColors.accent)}, 0.5)`,
                                        },
                                        '&:active': {
                                            transform: 'translateY(1px)',
                                            boxShadow: `0 2px 8px rgba(${hexToRgb(themeColors.accent)}, 0.3)`,
                                        },
                                        '&.Mui-disabled': {
                                            background: 'linear-gradient(90deg, #ccc, #ddd)',
                                            boxShadow: 'none'
                                        }
                                    }}
                                    onClick={handleStartReview}
                                    disabled={loadingDue || dueReviewCount === 0}
                                >
                                    开始复习
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* 快速统计卡片 */}
                    <Grid item xs={12} md={6}>
                        <Card 
                            elevation={0} 
                            className="card-neumorphic" 
                            sx={{ 
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                backgroundColor: `${themeColors.light} !important`, // 添加!important确保样式不被覆盖
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: `0 15px 30px rgba(${hexToRgb(themeColors.secondary)}, 0.2)`
                                }
                            }}
                            component={Paper} // 显式指定为Paper组件
                        >
                            <Box 
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '5px',
                                    background: `linear-gradient(90deg, ${themeColors.tertiary}, ${themeColors.secondary})`,
                                }}
                            />
                            <CardContent>
                                <Typography 
                                    variant="h5" 
                                    gutterBottom 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        fontWeight: 'bold',
                                        color: themeColors.accent,
                                        mb: 3
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            mr: 1.5, 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: `rgba(${hexToRgb(themeColors.accent)}, 0.1)`,
                                        }}
                                    >
                                        <span role="img" aria-label="stats">📊</span>
                                    </Box>
                                    学习统计
                                </Typography>
                                
                                {/* 添加词汇量测试入口 */}
                                <Box 
                                    sx={{ 
                                        mb: 4,
                                        p: 3,
                                        borderRadius: '16px',
                                        background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.accent)}, 0.1), rgba(${hexToRgb(themeColors.tertiary)}, 0.1))`,
                                        border: `1px dashed rgba(${hexToRgb(themeColors.accent)}, 0.3)`,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: `0 8px 25px rgba(${hexToRgb(themeColors.accent)}, 0.15)`
                                        }
                                    }}
                                >
                                    <Box 
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            mb: 2
                                        }}
                                    >
                                        <Box 
                                            sx={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.primary)}, 0.3), rgba(${hexToRgb(themeColors.secondary)}, 0.3))`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2,
                                                flexShrink: 0
                                            }}
                                        >
                                            <span 
                                                role="img" 
                                                aria-label="test"
                                                style={{ fontSize: '1.8rem' }}
                                            >
                                                🧠
                                            </span>
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5, color: themeColors.text }}>
                                                词汇量测试
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text }}>
                                                通过智能测试算法，精准评估您的英语词汇量水平
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Button
                                        component={RouterLink}
                                        to="/vocabulary-test"
                                        fullWidth
                                        sx={{
                                            background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})`,
                                            color: 'white',
                                            borderRadius: '30px',
                                            padding: '8px 16px',
                                            transition: 'all 0.3s ease',
                                            mt: 1,
                                            boxShadow: `0 4px 15px rgba(${hexToRgb(themeColors.secondary)}, 0.3)`,
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 20px rgba(${hexToRgb(themeColors.secondary)}, 0.4)`,
                                            }
                                        }}
                                    >
                                        开始测试
                                    </Button>
                                </Box>
                                
                                {/* 原有的统计信息 */}
                                {loadingStats ? 
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                        <div className="spinner" />
                                    </Box> 
                                    : errorStats ? 
                                    <Alert severity="error" size="small">{errorStats}</Alert> 
                                    : overviewStats ? (
                                    <Grid container spacing={3} sx={{ mt: 1 }}>
                                        <Grid item xs={6}>
                                            <Box 
                                                sx={{ 
                                                    p: 2, 
                                                    pt: 4,
                                                    pb: 4,
                                                    borderRadius: '16px', 
                                                    background: `rgba(${hexToRgb(themeColors.secondary)}, 0.1)`,
                                                    textAlign: 'center',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: `0 10px 20px rgba(${hexToRgb(themeColors.secondary)}, 0.2)`
                                                    }
                                                }}
                                                className="animate-fade-in"
                                            >
                                                <Typography 
                                                    variant="h2" 
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        mb: 1,
                                                        color: themeColors.accent,
                                                    }}
                                                >
                                                    {overviewStats.totalLearnedCount}
                                                </Typography>
                                                <Typography 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        color: themeColors.text,
                                                    }}
                                                >
                                                    <span role="img" aria-label="learned" style={{ marginRight: '5px' }}>
                                                        📚
                                                    </span>
                                                    已学单词
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box 
                                                sx={{ 
                                                    p: 2, 
                                                    pt: 4,
                                                    pb: 4,
                                                    borderRadius: '16px', 
                                                    background: `rgba(${hexToRgb(themeColors.accent)}, 0.1)`,
                                                    textAlign: 'center',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: `0 10px 20px rgba(${hexToRgb(themeColors.accent)}, 0.2)`
                                                    }
                                                }}
                                                className="animate-fade-in"
                                                style={{ animationDelay: '0.2s' }}
                                            >
                                                <Typography 
                                                    variant="h2" 
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        mb: 1,
                                                        color: themeColors.accent,
                                                    }}
                                                >
                                                    {overviewStats.masteredCount}
                                                </Typography>
                                                <Typography 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        color: themeColors.text,
                                                    }}
                                                >
                                                    <span role="img" aria-label="mastered" style={{ marginRight: '5px' }}>
                                                        🎓
                                                    </span>
                                                    已掌握单词
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Box
                                                sx={{ 
                                                    p: 2, 
                                                    borderRadius: '16px', 
                                                    background: `rgba(${hexToRgb(themeColors.tertiary)}, 0.1)`,
                                                    mt: 1,
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: `0 6px 15px rgba(${hexToRgb(themeColors.tertiary)}, 0.15)`
                                                    }
                                                }}
                                                className="animate-fade-in"
                                                style={{ animationDelay: '0.4s' }}
                                            >
                                                <span 
                                                    role="img" 
                                                    aria-label="streak" 
                                                    style={{ 
                                                        fontSize: '1.8rem', 
                                                        marginRight: '12px',
                                                    }}
                                                >
                                                    🔥
                                                </span>
                                                <Box>
                                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: themeColors.accent }}>
                                                        {overviewStats.currentStreak || 0}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: themeColors.text }}>
                                                        连续学习天数
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Typography color={themeColors.text}>无法加载统计。</Typography>
                                )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                                <Button
                                    component={RouterLink} 
                                    to="/statistics"
                                    size="large"
                                    sx={{
                                        background: `linear-gradient(90deg, ${themeColors.tertiary}, ${themeColors.secondary})`,
                                        color: 'white',
                                        borderRadius: '30px',
                                        padding: '10px 30px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: `0 4px 15px rgba(${hexToRgb(themeColors.secondary)}, 0.3)`,
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: `0 8px 25px rgba(${hexToRgb(themeColors.secondary)}, 0.5)`,
                                        },
                                        '&:active': {
                                            transform: 'translateY(1px)',
                                            boxShadow: `0 2px 8px rgba(${hexToRgb(themeColors.secondary)}, 0.3)`,
                                        }
                                    }}
                                >
                                    查看详细统计
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                </Grid>
            </Box>

            {/* 快速访问区域 */}
            <Typography 
                variant="h5" 
                sx={{ 
                    mb: 3,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    color: themeColors.accent,
                }}
            >
                <span role="img" aria-label="quick access" style={{ marginRight: '10px' }}>🚀</span>
                快速访问
            </Typography>

            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card 
                        className="card-glass hover-lift" 
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: themeColors.light,
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 15px 30px rgba(${hexToRgb(themeColors.secondary)}, 0.2)`
                            }
                        }}
                        onClick={() => navigate('/wordbooks')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.secondary)}, 0.2), rgba(${hexToRgb(themeColors.accent)}, 0.2))`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="wordbook" style={{ fontSize: '2rem' }}>📚</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: themeColors.accent }}>
                            单词书
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text }}>
                            浏览和管理您的单词书
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card 
                        className="card-glass hover-lift" 
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: themeColors.light,
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 15px 30px rgba(${hexToRgb(themeColors.accent)}, 0.2)`
                            }
                        }}
                        onClick={() => navigate('/notebook')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.accent)}, 0.2), rgba(${hexToRgb(themeColors.secondary)}, 0.2))`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="notebook" style={{ fontSize: '2rem' }}>📝</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: themeColors.accent }}>
                            生词本
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text }}>
                            查看您保存的生词
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card 
                        className="card-glass hover-lift" 
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: themeColors.light,
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 15px 30px rgba(${hexToRgb(themeColors.tertiary)}, 0.2)`
                            }
                        }}
                        onClick={() => navigate('/plan-settings')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.tertiary)}, 0.2), rgba(${hexToRgb(themeColors.secondary)}, 0.2))`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="plan" style={{ fontSize: '2rem' }}>📅</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: themeColors.accent }}>
                            学习计划
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text }}>
                            设置您的学习目标
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card 
                        className="card-glass hover-lift" 
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: themeColors.light,
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 15px 30px rgba(${hexToRgb(themeColors.secondary)}, 0.2)`
                            }
                        }}
                        onClick={() => navigate('/reports')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, rgba(${hexToRgb(themeColors.secondary)}, 0.2), rgba(${hexToRgb(themeColors.accent)}, 0.2))`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="reports" style={{ fontSize: '2rem' }}>📊</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: themeColors.accent }}>
                            学习报告
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text }}>
                            查看学习进度报告
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

        </Container>
    );
}

export default HomePage;