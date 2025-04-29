import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../utils/api';

// MUI组件
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';

// 图表库组件 (如使用recharts)
// 引入图标
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import BookIcon from '@mui/icons-material/Book';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SchoolIcon from '@mui/icons-material/School';

// 请确保项目中安装了recharts: npm install recharts
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// TabPanel组件
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`stats-tabpanel-${index}`}
            aria-labelledby={`stats-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3, px: { xs: 0, sm: 2 } }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// 统计卡片组件
const StatCard = ({ title, value, unit = '', icon: Icon, bgGradient, animationDelay = 0 }) => (
    <Card 
        className="card-glass hover-lift animate-fade-in"
        elevation={0}
        sx={{ 
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            animation: `fadeIn 0.6s ease-out ${animationDelay}s forwards`,
            opacity: 0,
            transform: 'translateY(20px)',
        }}
    >
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: bgGradient || 'linear-gradient(90deg, #4776E6, #8E54E9)',
            }}
        />
        <CardContent sx={{ py: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            mb: 0.5,
                            fontWeight: 500,
                        }}
                    >
                        {Icon && <Icon fontSize="small" />}
                        {title}
                    </Typography>
                    <Typography
                        variant="h4"
                        component="div"
                        sx={{ 
                            fontWeight: 'bold',
                            background: bgGradient || 'linear-gradient(90deg, #4776E6, #8E54E9)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {value}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: '1rem',
                                ml: 0.5,
                                opacity: 0.7,
                                verticalAlign: 'middle',
                                fontWeight: 'normal'
                            }}
                        >
                            {unit}
                        </Typography>
                    </Typography>
                </Box>
                {Icon && (
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.03)',
                            color: '#666'
                        }}
                    >
                        <Icon fontSize="medium" />
                    </Box>
                )}
            </Box>
        </CardContent>
    </Card>
);

// 进度条卡片组件
const ProgressCard = ({ title, value, max, icon: Icon, bgGradient, animationDelay = 0 }) => {
    const percentage = Math.round((value / max) * 100) || 0;
    
    return (
        <Card 
            className="card-neumorphic hover-lift animate-fade-in"
            elevation={0}
            sx={{ 
                height: '100%', 
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                animation: `fadeIn 0.6s ease-out ${animationDelay}s forwards`,
                opacity: 0,
                transform: 'translateY(20px)',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {Icon && (
                        <Box 
                            sx={{ 
                                mr: 2, 
                                color: '#4776E6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'rgba(71, 118, 230, 0.1)'
                            }}
                        >
                            <Icon />
                        </Box>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                </Box>
                
                <Box sx={{ position: 'relative', mt: 1, mb: 0.5 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: bgGradient || 'linear-gradient(90deg, #4776E6, #8E54E9)'
                            }
                        }} 
                    />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {value} / {max}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: 'bold',
                            color: '#4776E6'
                        }}
                    >
                        {percentage}%
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

function StatisticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // 图表数据 - 示例
    const [dailyStats, setDailyStats] = useState([]);
    const [weeklyStats, setWeeklyStats] = useState([]);
    const [distributionData, setDistributionData] = useState([]);

    // 加载数据
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError('');
            try {
                // 获取学习统计数据
                // 从错误的路径 '/api/statistics' 修改为正确的路径 '/api/statistics/overview'
                const data = await apiFetch('/api/statistics/overview');
                setStats(data);
                
                // 获取学习进度数据
                try {
                    const progressData = await apiFetch('/api/statistics/progress_over_time?period=30d');
                    if (progressData && progressData.length > 0) {
                        // 转换后端数据到图表期望的格式
                        const formattedData = progressData.map(item => ({
                            date: item.date.substring(5), // 从YYYY-MM-DD截取MM-DD
                            learned: item.reviewCount || 0
                        }));
                        setDailyStats(formattedData);
                    } else {
                        setDailyStats(generateDailyData());
                    }
                } catch (err) {
                    console.error('获取进度数据失败:', err);
                    setDailyStats(generateDailyData());
                }
                
                // 获取弱点单词数据
                try {
                    const weakWordsData = await apiFetch('/api/statistics/weak_words');
                    // 这里可以使用弱点单词数据进行其他处理
                } catch (err) {
                    console.error('获取弱点单词数据失败:', err);
                }
                
                // 单词掌握分布数据
                if (data.distributionData) {
                    setDistributionData(data.distributionData);
                } else {
                    // 创建示例分布数据
                    setDistributionData([
                        { name: '已掌握', value: data.masteredCount || 0, color: '#4CAF50' },
                        { name: '学习中', value: (data.totalLearnedCount || 0) - (data.masteredCount || 0), color: '#2196F3' },
                        { name: '未学习', value: (data.totalWordCount || 0) - (data.totalLearnedCount || 0), color: '#9E9E9E' }
                    ]);
                }
            } catch (err) {
                setError(`获取统计数据失败: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStats();
    }, []);

    // 生成示例每日数据
    const generateDailyData = () => {
        const data = [];
        const currentDate = new Date();
        
        for (let i = 14; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - i);
            
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            data.push({
                date: formattedDate,
                learned: Math.floor(Math.random() * 40),
                mastered: Math.floor(Math.random() * 20)
            });
        }
        
        return data;
    };

    // 生成示例每周数据
    const generateWeeklyData = () => {
        const data = [];
        const weekNames = ['第一周', '第二周', '第三周', '第四周'];
        
        for (let i = 0; i < 4; i++) {
            data.push({
                week: weekNames[i],
                learned: Math.floor(Math.random() * 150) + 50,
                mastered: Math.floor(Math.random() * 100)
            });
        }
        
        return data;
    };

    // 处理选项卡变化
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // 图表专用颜色
    const chartColors = {
        learned: '#4776E6',
        mastered: '#8E54E9',
        pieColors: ['#4CAF50', '#2196F3', '#9E9E9E']
    };

    return (
        <Container maxWidth="lg" className="animate-fade-in">
            <Box sx={{ mt: 4, mb: 5 }}>
                <Typography 
                    component="h1" 
                    variant="h4" 
                    className="gradient-text" 
                    sx={{ 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <AssessmentIcon sx={{ mr: 1.5, fontSize: '2rem' }} />
                    学习统计
                </Typography>
            </Box>

            {/* 加载中提示 */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <div className="spinner" />
                </Box>
            )}

            {/* 错误信息 */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        my: 2,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.1)'
                    }}
                >
                    {error}
                </Alert>
            )}

            {/* 统计内容 */}
            {!loading && stats && (
                <>
                    {/* 顶部统计卡片 */}
                    <Fade in={true} timeout={800}>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard 
                                    title="总单词量" 
                                    value={stats.totalWordCount || 0} 
                                    unit="个" 
                                    icon={BookIcon} 
                                    bgGradient="linear-gradient(90deg, #4776E6, #8E54E9)"
                                    animationDelay={0.1}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard 
                                    title="已学习" 
                                    value={stats.totalLearnedCount || 0} 
                                    unit="个" 
                                    icon={LocalLibraryIcon} 
                                    bgGradient="linear-gradient(90deg, #2196F3, #03A9F4)"
                                    animationDelay={0.2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard 
                                    title="已掌握" 
                                    value={stats.masteredCount || 0} 
                                    unit="个" 
                                    icon={EmojiEventsIcon}
                                    bgGradient="linear-gradient(90deg, #4CAF50, #8BC34A)"
                                    animationDelay={0.3}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard 
                                    title="学习天数" 
                                    value={stats.learningDays || 0} 
                                    unit="天" 
                                    icon={CalendarTodayIcon}
                                    bgGradient="linear-gradient(90deg, #FF9800, #FF5722)" 
                                    animationDelay={0.4}
                                />
                            </Grid>
                        </Grid>
                    </Fade>

                    {/* 进度条统计 */}
                    <Slide direction="up" in={true} timeout={1000} mountOnEnter>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={6}>
                                <ProgressCard 
                                    title="总体学习进度" 
                                    value={stats.totalLearnedCount || 0} 
                                    max={stats.totalWordCount || 1}
                                    icon={TrendingUpIcon}
                                    animationDelay={0.5}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <ProgressCard 
                                    title="已掌握比例" 
                                    value={stats.masteredCount || 0} 
                                    max={stats.totalLearnedCount || 1}
                                    icon={SchoolIcon}
                                    bgGradient="linear-gradient(90deg, #4CAF50, #8BC34A)"
                                    animationDelay={0.6}
                                />
                            </Grid>
                        </Grid>
                    </Slide>

                    {/* 图表选项卡 */}
                    <Box 
                        sx={{ 
                            width: '100%', 
                            mt: 5,
                            borderRadius: '16px',
                            overflow: 'hidden',
                        }}
                        className="card-neumorphic"
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange} 
                                aria-label="统计图表选项卡"
                                variant="fullWidth"
                                sx={{
                                    '& .MuiTab-root': {
                                        py: 2,
                                        transition: 'all 0.3s ease',
                                    },
                                    '& .Mui-selected': {
                                        color: '#4776E6 !important',
                                        fontWeight: 'bold',
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#4776E6',
                                        height: '3px'
                                    }
                                }}
                            >
                                <Tab 
                                    icon={<EqualizerIcon />} 
                                    label="每日统计" 
                                    iconPosition="start" 
                                />
                                <Tab 
                                    icon={<TrendingUpIcon />} 
                                    label="每周趋势" 
                                    iconPosition="start" 
                                />
                                <Tab 
                                    icon={<AssessmentIcon />} 
                                    label="单词分布" 
                                    iconPosition="start" 
                                />
                            </Tabs>
                        </Box>

                        {/* 每日统计图表 */}
                        <TabPanel value={tabValue} index={0}>
                            <Typography 
                                variant="h6" 
                                gutterBottom 
                                sx={{ 
                                    mb: 3, 
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}
                            >
                                最近15天学习情况
                            </Typography>
                            <Box 
                                sx={{ 
                                    width: '100%', 
                                    height: 300, 
                                    p: 1,
                                    '& .recharts-default-tooltip': {
                                        borderRadius: '10px',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                        border: 'none'
                                    }
                                }}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={dailyStats}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fill: '#666' }}
                                            axisLine={{ stroke: '#e0e0e0' }}
                                        />
                                        <YAxis 
                                            tick={{ fill: '#666' }}
                                            axisLine={{ stroke: '#e0e0e0' }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                            contentStyle={{ 
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                border: 'none'
                                            }}
                                        />
                                        <Legend />
                                        <Bar 
                                            dataKey="learned" 
                                            name="新学单词" 
                                            stackId="a" 
                                            fill={chartColors.learned} 
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar 
                                            dataKey="mastered" 
                                            name="掌握单词" 
                                            stackId="a" 
                                            fill={chartColors.mastered} 
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </TabPanel>

                        {/* 每周趋势图表 */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography 
                                variant="h6" 
                                gutterBottom 
                                sx={{ 
                                    mb: 3, 
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}
                            >
                                每周学习趋势
                            </Typography>
                            <Box sx={{ width: '100%', height: 300, p: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={weeklyStats}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis 
                                            dataKey="week" 
                                            tick={{ fill: '#666' }}
                                            axisLine={{ stroke: '#e0e0e0' }}
                                        />
                                        <YAxis 
                                            tick={{ fill: '#666' }}
                                            axisLine={{ stroke: '#e0e0e0' }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                border: 'none'
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="learned"
                                            name="新学单词"
                                            stroke={chartColors.learned}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="mastered"
                                            name="掌握单词"
                                            stroke={chartColors.mastered}
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </TabPanel>

                        {/* 单词分布图表 */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography 
                                variant="h6" 
                                gutterBottom 
                                sx={{ 
                                    mb: 3, 
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}
                            >
                                单词学习状态分布
                            </Typography>
                            <Box sx={{ width: '100%', height: 300, p: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || chartColors.pieColors[index % chartColors.pieColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => [`${value} 个单词`, '']}
                                            contentStyle={{ 
                                                borderRadius: '10px',
                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                border: 'none'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </TabPanel>
                    </Box>

                    {/* 学习报告链接 */}
                    <Box 
                        sx={{ 
                            mt: 5, 
                            textAlign: 'center',
                            animation: 'fadeIn 0.8s ease-out 0.8s forwards',
                            opacity: 0
                        }}
                    >
                        <Button
                            component={Link}
                            to="/reports"
                            variant="contained"
                            startIcon={<AssessmentIcon />}
                            sx={{
                                borderRadius: '50px',
                                py: 1.5,
                                px: 4,
                                background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                boxShadow: '0 8px 16px rgba(71, 118, 230, 0.3)',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 12px 20px rgba(71, 118, 230, 0.4)',
                                    transform: 'translateY(-3px)'
                                },
                            }}
                        >
                            查看详细学习报告
                        </Button>
                    </Box>
                </>
            )}
        </Container>
    );
}

export default StatisticsPage;