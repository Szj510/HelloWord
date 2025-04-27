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
// import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'; // 提醒图标
// import AssignmentIcon from '@mui/icons-material/Assignment'; // 任务图标
// import SchoolIcon from '@mui/icons-material/School'; // 掌握图标


// --- (StatCard 组件可以复用或重新定义) ---
const StatCard = ({ title, value, unit = '', icon = null }) => (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        {icon && <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>}
        <Box>
            <Typography color="text.secondary">{title}</Typography>
            <Typography variant="h5" component="div">
                {value}{unit}
            </Typography>
        </Box>
    </Card>
);


function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // --- V 新增状态 --- V
    const [overviewStats, setOverviewStats] = useState(null);
    const [dueReviewCount, setDueReviewCount] = useState(0);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingDue, setLoadingDue] = useState(true);
    const [errorStats, setErrorStats] = useState('');
    const [errorDue, setErrorDue] = useState('');
    // --- ^ 新增结束 ^ ---

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


    const handleLogout = () => { /* ... (不变) ... */ };

    const handleStartReview = () => {
        // TODO: 跳转到专门的复习页面，或者带参数跳转到学习页面
        // 暂时先跳转到单词书列表，让用户选择
        navigate('/wordbooks');
        alert("请选择一本单词书开始复习需要回顾的单词。"); // 临时提示
    };

     const handleStartNew = () => {
         // TODO: 跳转到选择单词书或直接开始新词学习
         navigate('/wordbooks'); // 暂时跳转到单词书列表
         alert("请选择一本单词书开始学习新单词。"); // 临时提示
     };


    return (
        <Container maxWidth="lg">
            <Typography component="h1" variant="h4" gutterBottom sx={{ mt: 2, mb: 3 }}>
                {user ? `欢迎回来, ${user.username || user.email}!` : '主页'}
            </Typography>

            {/* --- V 重新布局 --- V */}
            <Grid container spacing={3}>

                {/* --- 学习任务卡片 --- */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                 今日任务
                                 {/* <AssignmentIcon sx={{ verticalAlign: 'bottom', ml: 1 }} /> */}
                            </Typography>
                            {loadingDue ? <CircularProgress size={20} /> : errorDue ? <Alert severity="error" size="small">{errorDue}</Alert> : (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        {/* <NotificationsActiveIcon sx={{ mr: 1, color: dueReviewCount > 0 ? 'warning.main' : 'action.disabled' }} /> */}
                                        <Typography variant="body1">
                                            当前有 <strong>{dueReviewCount}</strong> 个单词需要复习。
                                        </Typography>
                                    </Box>
                                     {/* 可以添加新词任务 */}
                                     {/* <Typography variant="body1">计划学习 <strong>20</strong> 个新单词。</Typography> */}
                                </>
                            )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                             {/* <Button size="small" onClick={handleStartNew}>学习新词</Button> */}
                            <Button
                                size="medium"
                                variant="contained"
                                onClick={handleStartReview}
                                disabled={loadingDue || dueReviewCount === 0}
                             >
                                开始复习
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                {/* --- 快速统计卡片 --- */}
                <Grid item xs={12} md={6}>
                     <Card elevation={2}>
                         <CardContent>
                             <Typography variant="h5" gutterBottom>学习总览</Typography>
                             {loadingStats ? <CircularProgress size={20} /> : errorStats ? <Alert severity="error" size="small">{errorStats}</Alert> : overviewStats ? (
                                <Grid container spacing={2}>
                                     <Grid item xs={6}>
                                         <Typography variant="h6">{overviewStats.totalLearnedCount}</Typography>
                                         <Typography color="text.secondary">已学单词</Typography>
                                     </Grid>
                                     <Grid item xs={6}>
                                          <Typography variant="h6">{overviewStats.masteredCount}</Typography>
                                          <Typography color="text.secondary">已掌握单词</Typography>
                                           {/* <SchoolIcon sx={{ verticalAlign: 'bottom', ml: 0.5, fontSize: '1rem' }} /> */}
                                      </Grid>
                                     {/* 可以添加更多，如学习天数、正确率 */}
                                     {/* <Grid item xs={6}><Typography variant="h6">{stats.totalStudyDays}</Typography><Typography color="text.secondary">学习天数</Typography></Grid> */}
                                     {/* <Grid item xs={6}><Typography variant="h6">{stats.overallAccuracy}%</Typography><Typography color="text.secondary">正确率</Typography></Grid> */}
                                </Grid>
                             ) : (<Typography>无法加载统计。</Typography>) }
                         </CardContent>
                         <CardActions sx={{ justifyContent: 'flex-end' }}>
                              <Button size="small" component={RouterLink} to="/statistics">查看详细统计</Button>
                          </CardActions>
                     </Card>
                </Grid>

                 {/* --- 单词书快捷入口 (可选) --- */}
                 {/* <Grid item xs={12}> <Card><CardContent>...</CardContent></Card> </Grid> */}

            </Grid>

             {/* --- 退出登录按钮可以移到底部或保留在 Navbar --- */}
             <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                 <Button variant="outlined" color="secondary" onClick={handleLogout}>
                      退出登录
                  </Button>
             </Box>
            {/* --- ^ 布局结束 ^ --- */}

        </Container>
    );
}

export default HomePage;