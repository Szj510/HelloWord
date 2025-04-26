import React, { useState, useEffect } from 'react';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';

// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid'; // 用于布局卡片
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import List from '@mui/material/List'; // <--- 需要 List, ListItem, ListItemText
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip'; // <--- 用于显示错误率等信息
import Tooltip from '@mui/material/Tooltip'; // <--- 用于显示提示信息
// Recharts components (保持不变)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
// 简单的统计卡片组件
const StatCard = ({ title, value, unit = '' }) => (
    <Card sx={{ textAlign: 'center', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4" component="div">
                {value}{unit}
            </Typography>
        </CardContent>
    </Card>
);


function StatisticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();

    const [progressData, setProgressData] = useState([]);
    const [progressLoading, setProgressLoading] = useState(true);
    const [progressError, setProgressError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 默认 7 天

    const [weakWords, setWeakWords] = useState([]);
    const [weakWordsLoading, setWeakWordsLoading] = useState(true);
    const [weakWordsError, setWeakWordsError] = useState('');
    useEffect(() => {
        const fetchStats = async () => {
            if (!isAuthenticated) {
                 setError("请先登录查看统计数据。");
                 setLoading(false);
                 return;
            }
            setLoading(true);
            setError('');
            try {
                const data = await apiFetch('/api/statistics/overview');
                setStats(data);
            } catch (err) {
                setError(`获取统计数据失败: ${err.message}`);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [isAuthenticated]); // 依赖认证状态

    useEffect(() => {
        const fetchProgressData = async () => {
            if (!isAuthenticated) return; // 未登录不获取
            setProgressLoading(true);
            setProgressError('');
            try {
                const data = await apiFetch(`/api/statistics/progress_over_time?period=${selectedPeriod}`);
                // 可以对数据进行一些预处理，例如格式化日期 (如果需要)
                setProgressData(data || []);
            } catch (err) {
                setProgressError(`获取学习进度失败: ${err.message}`);
                setProgressData([]);
            } finally {
                setProgressLoading(false);
            }
        };
        fetchProgressData();
    }, [isAuthenticated, selectedPeriod]); // 当认证状态或时间段选择变化时获取

    const handlePeriodChange = (event, newPeriod) => {
      if (newPeriod !== null) { // ToggleButtonGroup 要求非空
        setSelectedPeriod(newPeriod);
        // useEffect 会自动触发数据重新获取
      }
    };

    useEffect(() => {
        const fetchWeakWords = async () => {
            if (!isAuthenticated) return;
            setWeakWordsLoading(true);
            setWeakWordsError('');
            try {
                const data = await apiFetch('/api/statistics/weak_words');
                setWeakWords(data || []);
            } catch (err) {
                setWeakWordsError(`获取薄弱单词失败: ${err.message}`);
                setWeakWords([]);
            } finally {
                setWeakWordsLoading(false);
            }
        };
        fetchWeakWords();
    }, [isAuthenticated]); // 仅依赖认证状态

    if (loading) {
        return (
             <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                 <CircularProgress />
             </Box>
         );
    }

    if (error) {
        return (
            <Container maxWidth="sm">
                <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
            </Container>
        );
    }

    // 正常显示统计数据
    return (
        <Container maxWidth="lg">
            <Typography component="h1" variant="h4" gutterBottom sx={{ my: 2 }}>
                学习统计概览
            </Typography>

            {/* 概览卡片 Grid (不变) */}
            {!loading && !error && stats ? (
                 <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={3}><StatCard title="已学单词总数" value={stats.totalLearnedCount} /></Grid>
                      <Grid item xs={12} sm={6} md={3}><StatCard title="已掌握单词数" value={stats.masteredCount} /></Grid>
                      <Grid item xs={12} sm={6} md={3}><StatCard title="累计学习天数" value={stats.totalStudyDays} unit=" 天" /></Grid>
                      <Grid item xs={12} sm={6} md={3}><StatCard title="总体正确率" value={stats.overallAccuracy} unit=" %" /></Grid>
                 </Grid>
             ) : (<Typography sx={{mt:2}}>无法加载概览数据。</Typography>)}


             <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography component="h2" variant="h5">
                      学习进度
                 </Typography>
                 {/* --- V 新增: 时间段切换按钮 --- V */}
                 <ToggleButtonGroup
                     color="primary"
                     value={selectedPeriod}
                     exclusive
                     onChange={handlePeriodChange}
                     aria-label="Time Period"
                     size="small"
                 >
                     <ToggleButton value="7d">近 7 天</ToggleButton>
                     <ToggleButton value="30d">近 30 天</ToggleButton>
                     {/* <ToggleButton value="all">全部</ToggleButton> */}
                 </ToggleButtonGroup>
                 {/* --- ^ 新增结束 ^ --- */}
             </Box>

             {/* --- V 新增: 进度图表区域 --- V */}
             <Box sx={{ height: 300, width: '100%', mt: 1 }}> {/* 给图表容器设置高度 */}
                 {progressLoading && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                         <CircularProgress />
                     </Box>
                 )}
                 {progressError && !progressLoading && (
                     <Alert severity="error">{progressError}</Alert>
                 )}
                 {!progressLoading && !progressError && progressData.length === 0 && (
                     <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                         选定时间段内无学习记录。
                     </Typography>
                 )}
                 {!progressLoading && !progressError && progressData.length > 0 && (
                     // 使用 ResponsiveContainer 使图表自适应父容器大小
                     <ResponsiveContainer width="100%" height="100%">
                         <LineChart
                             data={progressData}
                             margin={{ top: 5, right: 30, left: 0, bottom: 5 }} // 调整边距给标签留空间
                         >
                             <CartesianGrid strokeDasharray="3 3" /> {/* 网格线 */}
                             <XAxis
                                 dataKey="date" // X轴使用 date 字段
                                 tickFormatter={(tick) => dayjs(tick).format('MM/DD')} // 格式化日期显示
                                 // angle={-30} textAnchor="end" // 如果标签太密集可以倾斜
                                 // interval="preserveStartEnd" // 保证首尾标签显示
                             />
                             <YAxis allowDecimals={false} /> {/* Y轴不允许小数 */}
                             <Tooltip /> {/* 鼠标悬停提示 */}
                             <Legend /> {/* 图例 */}
                             <Line
                                 type="monotone" // 线条样式
                                 dataKey="reviewCount" // Y轴数据字段
                                 stroke="#8884d8"    // 线条颜色
                                 strokeWidth={2}     // 线条宽度
                                 name="每日复习次数" // 图例名称
                                 activeDot={{ r: 8 }} // 鼠标悬停时点的样式
                              />
                             {/* 可以添加其他 Line 来显示不同数据 */}
                             {/* <Line type="monotone" dataKey="correctCount" stroke="#82ca9d" name="每日正确次数" /> */}
                         </LineChart>
                     </ResponsiveContainer>
                 )}
             </Box>
             {/* --- ^ 新增结束 ^ --- */}


            <Divider sx={{ my: 4 }} />

            <Typography component="h2" variant="h5" gutterBottom>
                薄弱环节分析
            </Typography>
            <Box sx={{ mt: 2 }}>
                 <Typography variant="h6" gutterBottom>需要加强的单词:</Typography>
                 {weakWordsLoading && <CircularProgress size={24} />}
                 {weakWordsError && !weakWordsLoading && <Alert severity="error">{weakWordsError}</Alert>}
                 {!weakWordsLoading && !weakWordsError && weakWords.length === 0 && (
                     <Typography color="text.secondary">太棒了！暂时没有发现明显的薄弱单词。</Typography>
                 )}
                 {!weakWordsLoading && !weakWordsError && weakWords.length > 0 && (
                     <List dense> {/* dense 使列表项更紧凑 */}
                         {weakWords.map((item) => (
                             <ListItem key={item.word._id} divider>
                                 <ListItemText
                                     primary={item.word.spelling}
                                     secondary={`[${item.word.phonetic || 'N/A'}] ${item.word.meaning || 'N/A'}`}
                                 />
                                 <Tooltip title={`状态: ${item.status} | 尝试次数: ${item.totalAttempts} | 最后复习: ${item.lastReviewedAt ? dayjs(item.lastReviewedAt).format('YYYY/MM/DD') : 'N/A'}`} placement="top">
                                      <Chip
                                         label={`错误率: ${Math.round(item.errorRate * 100)}%`}
                                         color="error"
                                         size="small"
                                         variant="outlined"
                                         sx={{ ml: 2 }}
                                      />
                                 </Tooltip>
                                 {/* 可以添加一个 "去复习" 按钮 */}
                                 {/* <Button size="small" sx={{ml: 1}}>去复习</Button> */}
                             </ListItem>
                         ))}
                     </List>
                 )}
             </Box>
             {/* --- ^ 修改结束 ^ --- */}

             {/* (其他待添加分析的占位符) */}
             {/* <ul><li>学习效率指数</li><li>记忆曲线拟合</li></ul> */}

        </Container>
    );
}

export default StatisticsPage;