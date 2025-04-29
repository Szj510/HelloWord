import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // 使用 RouterLink
import { useAuth } from '../context/AuthContext';
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

// --- 自定义StatCard组件，添加动画和效果 ---
const StatCard = ({ title, value, unit = '', icon = null, animationDelay = 0 }) => (
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
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
            }
        }}
    >
        {icon && <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>}
        <Box>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{title}</Typography>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }} className="gradient-text">
                {value}{unit}
            </Typography>
        </Box>
    </Card>
);

function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [overviewStats, setOverviewStats] = useState(null);
    const [dueReviewCount, setDueReviewCount] = useState(0);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingDue, setLoadingDue] = useState(true);
    const [errorStats, setErrorStats] = useState('');
    const [errorDue, setErrorDue] = useState('');
    const [currentPlan, setCurrentPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(true); 

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

    // 获取待复习数量
    useEffect(() => {
        const fetchDue = async () => {
            setLoadingDue(true);
            setErrorDue('');
            try {
                const data = await apiFetch('/api/learning/due');
                setDueReviewCount(data?.dueReviewCount || 0);
            } catch (err) { setErrorDue(`获取待复习数量失败: ${err.message}`); }
            finally { setLoadingDue(false); }
        };
        fetchDue();
    }, []); // 加载一次

    useEffect(() => {
         const fetchCurrentPlan = async () => {
             setLoadingPlan(true);
             try {
                 const data = await apiFetch('/api/plans/current');
                 setCurrentPlan(data.plan); // data.plan 可能是 null 或 plan 对象
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

    const handleStartReview = () => {
        navigate('/wordbooks');
    };

    const handleStartNew = () => {
        navigate('/wordbooks');
    };

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
                    background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
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
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(120deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
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
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: '0 15px 30px rgba(71, 118, 230, 0.1)'
                                }
                            }}
                        >
                            <Box 
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '5px',
                                    background: 'linear-gradient(90deg, #4776E6, #8E54E9)'
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
                                        color: '#4776E6',
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
                                            background: 'linear-gradient(135deg, rgba(71, 118, 230, 0.2), rgba(142, 84, 233, 0.2))',
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
                                            background: 'rgba(33, 150, 243, 0.1)',
                                            borderRadius: '12px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.2)'
                                            },
                                            border: '1px dashed rgba(33, 150, 243, 0.3)'
                                        }} 
                                        icon={false}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <span role="img" aria-label="info" style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                                                ℹ️
                                            </span>
                                            <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                                                当前学习计划
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 4 }}>
                                            <Typography sx={{ fontWeight: 500, mb: 1, display: 'flex', alignItems: 'center' }}>
                                                <span style={{ color: '#666', marginRight: '8px' }}>•</span>
                                                每日新学: <span className="gradient-text" style={{ fontWeight: 'bold', marginLeft: '5px' }}>{currentPlan.dailyNewWordsTarget}词</span>
                                            </Typography>
                                            <Typography sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                                                <span style={{ color: '#666', marginRight: '8px' }}>•</span>
                                                每日复习: <span className="gradient-text" style={{ fontWeight: 'bold', marginLeft: '5px' }}>{currentPlan.dailyReviewWordsTarget}词</span>
                                            </Typography>
                                        </Box>
                                        <Button 
                                            component={RouterLink} 
                                            to="/plan-settings" 
                                            size="small" 
                                            sx={{
                                                mt: 2,
                                                background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
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
                                            background: 'rgba(255, 193, 7, 0.1)',
                                            borderRadius: '12px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)'
                                            },
                                            border: '1px dashed rgba(255, 193, 7, 0.3)'
                                        }}
                                        icon={false}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <span role="img" aria-label="warning" style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                                                ⚠️
                                            </span>
                                            <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                                                未设置学习计划
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ pl: 4, mb: 1 }}>
                                            当前无学习计划，将使用默认设置。设置个人专属学习计划可以提高学习效率！
                                        </Typography>
                                        <Button 
                                            component={RouterLink} 
                                            to="/plan-settings" 
                                            size="small"
                                            sx={{
                                                mt: 1,
                                                background: 'linear-gradient(90deg, #FF9800, #FF5722)',
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
                                                ? 'rgba(71, 118, 230, 0.08)' 
                                                : 'rgba(76, 175, 80, 0.08)',
                                            border: dueReviewCount > 0
                                                ? '1px dashed rgba(71, 118, 230, 0.3)'
                                                : '1px dashed rgba(76, 175, 80, 0.3)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.07)'
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
                                                    ? 'linear-gradient(135deg, rgba(71, 118, 230, 0.2), rgba(142, 84, 233, 0.2))'
                                                    : 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2))',
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
                                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>
                                                {dueReviewCount > 0 ? '复习提醒' : '已完成今日复习'}
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary">
                                                {dueReviewCount > 0 
                                                    ? <>当前有 <span className="gradient-text" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{dueReviewCount}</span> 个单词需要复习</>
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
                                        background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                        color: 'white',
                                        borderRadius: '30px',
                                        padding: '10px 30px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 15px rgba(71, 118, 230, 0.3)',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: '0 8px 25px rgba(71, 118, 230, 0.5)',
                                        },
                                        '&:active': {
                                            transform: 'translateY(1px)',
                                            boxShadow: '0 2px 8px rgba(71, 118, 230, 0.3)',
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
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: '0 15px 30px rgba(142, 84, 233, 0.1)'
                                }
                            }}
                        >
                            <Box 
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '5px',
                                    background: 'linear-gradient(90deg, #8E54E9, #4776E6)'
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
                                        color: '#8E54E9',
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
                                            background: 'linear-gradient(135deg, rgba(142, 84, 233, 0.2), rgba(71, 118, 230, 0.2))',
                                        }}
                                    >
                                        <span 
                                            role="img" 
                                            aria-label="statistics" 
                                            style={{ fontSize: '1.4rem' }}
                                        >
                                            📊
                                        </span>
                                    </Box>
                                    学习总览
                                </Typography>
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
                                                    background: 'rgba(142, 84, 233, 0.08)',
                                                    textAlign: 'center',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: '0 10px 20px rgba(142, 84, 233, 0.2)'
                                                    }
                                                }}
                                                className="animate-fade-in"
                                            >
                                                <Typography 
                                                    variant="h2" 
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        mb: 1,
                                                        background: 'linear-gradient(90deg, #8E54E9, #4776E6)',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}
                                                >
                                                    {overviewStats.totalLearnedCount}
                                                </Typography>
                                                <Typography 
                                                    color="text.secondary" 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
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
                                                    background: 'rgba(71, 118, 230, 0.08)',
                                                    textAlign: 'center',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: '0 10px 20px rgba(71, 118, 230, 0.2)'
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
                                                        background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}
                                                >
                                                    {overviewStats.masteredCount}
                                                </Typography>
                                                <Typography 
                                                    color="text.secondary" 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center'
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
                                                    background: 'rgba(76, 175, 80, 0.08)',
                                                    mt: 1,
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: '0 6px 15px rgba(76, 175, 80, 0.15)'
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
                                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }} className="gradient-text">
                                                        {overviewStats.currentStreak || 0}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        连续学习天数
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Typography>无法加载统计。</Typography>
                                )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                                <Button
                                    component={RouterLink} 
                                    to="/statistics"
                                    size="large"
                                    sx={{
                                        background: 'linear-gradient(90deg, #8E54E9, #4776E6)',
                                        color: 'white',
                                        borderRadius: '30px',
                                        padding: '10px 30px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 15px rgba(142, 84, 233, 0.3)',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: '0 8px 25px rgba(142, 84, 233, 0.5)',
                                        },
                                        '&:active': {
                                            transform: 'translateY(1px)',
                                            boxShadow: '0 2px 8px rgba(142, 84, 233, 0.3)',
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
                    alignItems: 'center'
                }}
                className="gradient-text"
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
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 15px 30px rgba(71, 118, 230, 0.2)'
                            }
                        }}
                        onClick={() => navigate('/wordbooks')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(71, 118, 230, 0.2), rgba(142, 84, 233, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="wordbook" style={{ fontSize: '2rem' }}>📚</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }} className="gradient-text">
                            单词书
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
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
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 15px 30px rgba(142, 84, 233, 0.2)'
                            }
                        }}
                        onClick={() => navigate('/notebook')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(142, 84, 233, 0.2), rgba(71, 118, 230, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="notebook" style={{ fontSize: '2rem' }}>📝</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }} className="gradient-text">
                            生词本
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
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
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 15px 30px rgba(76, 175, 80, 0.2)'
                            }
                        }}
                        onClick={() => navigate('/plan-settings')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="plan" style={{ fontSize: '2rem' }}>📅</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }} className="gradient-text">
                            学习计划
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
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
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 15px 30px rgba(255, 152, 0, 0.2)'
                            }
                        }}
                        onClick={() => navigate('/reports')}
                    >
                        <Box 
                            sx={{ 
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 87, 34, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <span role="img" aria-label="reports" style={{ fontSize: '2rem' }}>📊</span>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }} className="gradient-text">
                            学习报告
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            查看学习进度报告
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

        </Container>
    );
}

export default HomePage;