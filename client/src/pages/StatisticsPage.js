import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES, THEME_MODES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// 图表库组件 (如使用recharts)
// 引入图标
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookIcon from '@mui/icons-material/Book';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SchoolIcon from '@mui/icons-material/School';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import WarningIcon from '@mui/icons-material/Warning';

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

// 优化的统计卡片组件
const StatCard = ({ title, value, icon: Icon, startColor = earthToneColors.caramelBrown, endColor = earthToneColors.deepMilkTea, animationDelay = 0 }) => {
    // 获取当前主题和配色方案
    const { colorScheme, themeMode } = useTheme();
    const isDarkMode = themeMode === THEME_MODES.DARK;

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

    return (
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
                backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
            }}
            component={Paper} // 显式指定为Paper组件
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${startColor}, ${endColor})`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    borderRadius: '50%',
                    width: '100px',
                    height: '100px',
                    transform: 'translate(-30%, -30%)',
                    opacity: isDarkMode ? 0.15 : 0.08,
                }}
            />
            <CardContent sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h4"
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            background: `linear-gradient(90deg, ${startColor}, ${endColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {value}
                    </Typography>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${startColor}, ${endColor})`,
                            color: '#fff',
                            boxShadow: isDarkMode ? `0 4px 12px ${startColor}80` : `0 4px 12px ${startColor}40`
                        }}
                    >
                        <Icon />
                    </Box>
                </Box>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                        mt: 1,
                    }}
                >
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
};

// 增强的进度条卡片组件
const ProgressCard = ({ title, value, maxValue, unit = '', startColor = earthToneColors.caramelBrown, endColor = earthToneColors.deepMilkTea, icon: Icon, bgGradient, animationDelay = 0 }) => {
    const percentage = Math.min(100, (value / maxValue) * 100) || 0;

    // 获取当前主题和配色方案
    const { colorScheme, themeMode } = useTheme();
    const isDarkMode = themeMode === THEME_MODES.DARK;

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

    return (
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
                backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
            }}
            component={Paper} // 显式指定为Paper组件
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: bgGradient || `linear-gradient(90deg, ${startColor}, ${endColor})`,
                }}
            />
            <CardContent sx={{ py: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 500,
                        }}
                    >
                        {Icon && <Icon fontSize="small" />}
                        {title}
                    </Typography>
                    {Icon && (
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background: 'rgba(0, 0, 0, 0.03)',
                                color: startColor
                            }}
                        >
                            <Icon fontSize="small" />
                        </Box>
                    )}
                </Box>
                <Box sx={{ mb: 1, position: 'relative' }}>
                    <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${startColor}, ${endColor})`,
                            }
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            background: `linear-gradient(90deg, ${startColor}, ${endColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {value}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: '0.875rem',
                                ml: 0.5,
                                opacity: 0.7,
                                verticalAlign: 'middle',
                                fontWeight: 'normal'
                            }}
                        >
                            {unit}
                        </Typography>
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 'bold',
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary',
                            opacity: 0.5
                        }}
                    >
                        {percentage.toFixed(0)}%
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

// 使用Memo优化的学习建议组件
const SuggestionCard = React.memo(({ suggestions, animationDelay = 0 }) => {
    // 获取当前主题和配色方案
    const { colorScheme, themeMode } = useTheme();
    const isDarkMode = themeMode === THEME_MODES.DARK;

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

    return (
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
                backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
            }}
            component={Paper} // 显式指定为Paper组件
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: `linear-gradient(90deg, ${themeColors.secondary || themeColors.deepMilkTea}, ${themeColors.tertiary || themeColors.lightMilkTea})`,
                }}
            />
            <CardContent sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LightbulbIcon sx={{ color: themeColors.secondary || themeColors.deepMilkTea, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.secondary || themeColors.deepMilkTea }}>
                        学习建议
                    </Typography>
                </Box>
                <List disablePadding>
                    {suggestions && suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <ListItem
                                key={index}
                                disablePadding
                                sx={{
                                    mb: 0.5,
                                    pl: 0,
                                    pr: 1,
                                    borderRadius: '8px',
                                    '&:hover': {
                                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: '32px' }}>
                                    <ArrowRightIcon sx={{ color: themeColors.accent || themeColors.caramelBrown }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={suggestion}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        sx: { fontWeight: index === 0 ? 'medium' : 'normal' }
                                    }}
                                />
                            </ListItem>
                        ))
                    ) : (
                        <ListItem>
                            <ListItemText
                                primary="暂无个性化建议"
                                secondary="继续学习以获取智能建议"
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    sx: { textAlign: 'center', fontWeight: 'medium', pt: 1 }
                                }}
                                secondaryTypographyProps={{
                                    sx: { textAlign: 'center' }
                                }}
                            />
                        </ListItem>
                    )}
                </List>
            </CardContent>
        </Card>
    );
});

// 新增：薄弱单词组件
const WeakWordsCard = ({ animationDelay = 0 }) => {
    const [weakWords, setWeakWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activePlan, setActivePlan] = useState(null);
    const navigate = useNavigate();

    // 获取当前主题和配色方案
    const { colorScheme, themeMode } = useTheme();
    const isDarkMode = themeMode === THEME_MODES.DARK;

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

    // 使用主题颜色定义警告色，但保留足够的对比度
    const warningColor = themeColors.accent || themeColors.caramelBrown;
    const warningStartColor = themeColors.accent || themeColors.caramelBrown;
    const warningEndColor = themeColors.secondary || themeColors.deepMilkTea;

    useEffect(() => {
        const fetchWeakWords = async () => {
            setLoading(true);
            try {
                const data = await apiFetch('/api/statistics/weak_words');
                setWeakWords(data.slice(0, 5)); // 只取前5个
            } catch (err) {
                console.error('获取薄弱单词失败:', err);
                setError('获取薄弱单词失败');
            } finally {
                setLoading(false);
            }
        };

        const fetchActivePlan = async () => {
            try {
                const data = await apiFetch('/api/plans/current');
                if (data && data.plan && data.plan.targetWordbook) {
                    setActivePlan(data.plan);
                }
            } catch (err) {
                console.error('获取当前学习计划失败:', err);
            }
        };

        fetchWeakWords();
        fetchActivePlan();
    }, []);

    const handleReviewClick = () => {
        if (activePlan && activePlan.targetWordbook) {
            // 如果有活动计划，则使用其目标单词书ID进行复习
            navigate(`/learn/${activePlan.targetWordbook}`, {
                state: {
                    mode: 'review',
                    reviewLimit: activePlan.dailyReviewWordsTarget || 20
                }
            });
        } else {
            // 如果没有活动计划，则导航到单词书页面
            navigate('/wordbooks', {
                state: {
                    message: '请先选择一本单词书进行学习'
                }
            });
        }
    };

    return (
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
                backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
            }}
            component={Paper} // 显式指定为Paper组件
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: `linear-gradient(90deg, ${warningStartColor}, ${warningEndColor})`,
                }}
            />
            <CardContent sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ color: warningColor, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: warningColor }}>
                        需要加强的单词
                    </Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <LinearProgress
                            sx={{
                                width: '80%',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: themeColors.accent || themeColors.caramelBrown
                                }
                            }}
                        />
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                        <Typography variant="body2">{error}</Typography>
                    </Box>
                ) : weakWords.length > 0 ? (
                    <List disablePadding>
                        {weakWords.map((item, index) => (
                            <ListItem
                                key={index}
                                disablePadding
                                sx={{ mb: 1 }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    width: '100%',
                                    p: 1.5,
                                    borderRadius: '8px',
                                    backgroundColor: `rgba(${themeColors.accent === '#A67C52' ? '166, 124, 82' : themeColors.accent === '#607D8B' ? '96, 125, 139' : '106, 142, 106'}, 0.08)`,
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between'
                                }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {item.word.spelling}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" component="div">
                                            {item.word.meaning}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            backgroundColor: `rgba(${themeColors.accent === '#A67C52' ? '166, 124, 82' : themeColors.accent === '#607D8B' ? '96, 125, 139' : '106, 142, 106'}, 0.15)`,
                                            color: warningColor,
                                            borderRadius: '4px',
                                            px: 1,
                                            py: 0.5,
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        错误率: {Math.round(item.errorRate * 100)}%
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                        <Typography variant="body2">暂无薄弱单词数据</Typography>
                        <Typography variant="caption">继续学习以获取更多分析</Typography>
                    </Box>
                )}

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        onClick={handleReviewClick}
                        variant="contained"
                        size="small"
                        sx={{
                            borderRadius: '20px',
                            background: `linear-gradient(90deg, ${warningStartColor}, ${warningEndColor})`,
                            textTransform: 'none',
                            py: 0.5
                        }}
                    >
                        立即复习
                    </Button>
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

    // 获取当前主题和配色方案
    const { colorScheme, themeMode } = useTheme();
    const isDarkMode = themeMode === THEME_MODES.DARK;

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

    // 图表数据
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
                const data = await apiFetch('/api/statistics/overview');
                setStats(data);

                // 获取学习进度数据（每日）
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
                        // 没有学习数据时，显示空数组
                        setDailyStats([]);
                    }
                } catch (err) {
                    console.error('获取每日进度数据失败:', err);
                    // 错误时也显示空数组，而不是随机数据
                    setDailyStats([]);
                }

                // 获取每周数据（新增，使用真实数据）
                try {
                    const weeklyProgressData = await apiFetch('/api/statistics/weekly_progress');
                    if (weeklyProgressData && weeklyProgressData.length > 0) {
                        setWeeklyStats(weeklyProgressData);
                    } else {
                        // 没有学习数据时，显示空数组
                        setWeeklyStats([]);
                    }
                } catch (err) {
                    console.error('获取每周进度数据失败:', err);
                    // 错误时也显示空数组，而不是随机数据
                    setWeeklyStats([]);
                }

                // 获取单词分布数据（使用新API）
                try {
                    const distributionData = await apiFetch('/api/statistics/word_distribution');
                    if (distributionData) {
                        // 使用当前学习计划中的单词数据创建饼图
                        setDistributionData([
                            {
                                name: '已掌握',
                                value: distributionData.masteredCount || 1,
                                color: themeColors.accent || themeColors.caramelBrown
                            },
                            {
                                name: '学习中',
                                value: distributionData.learningCount || 1,
                                color: themeColors.secondary || themeColors.deepMilkTea
                            },
                            {
                                name: '未学习',
                                value: distributionData.notLearnedCount || 1,
                                color: themeColors.tertiary || themeColors.lightMilkTea
                            }
                        ]);
                    } else {
                        // 如果API未返回数据，使用默认数据
                        setDistributionData([
                            { name: '已掌握', value: 1, color: themeColors.accent || themeColors.caramelBrown },
                            { name: '学习中', value: 1, color: themeColors.secondary || themeColors.deepMilkTea },
                            { name: '未学习', value: 1, color: themeColors.tertiary || themeColors.lightMilkTea }
                        ]);
                    }
                } catch (err) {
                    console.error('获取单词分布数据失败:', err);
                    // 使用默认值
                    setDistributionData([
                        { name: '已掌握', value: 1, color: themeColors.accent || themeColors.caramelBrown },
                        { name: '学习中', value: 1, color: themeColors.secondary || themeColors.deepMilkTea },
                        { name: '未学习', value: 1, color: themeColors.tertiary || themeColors.lightMilkTea }
                    ]);
                }
            } catch (err) {
                setError(`获取统计数据失败: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [
        themeColors.accent,
        themeColors.caramelBrown,
        themeColors.secondary,
        themeColors.deepMilkTea,
        themeColors.tertiary,
        themeColors.lightMilkTea
    ]);

    // 处理选项卡变化
    const handleTabChange = (_, newValue) => {
        setTabValue(newValue);
    };

    // 使用useMemo缓存图表颜色，避免不必要的重新渲染
    const chartColors = useMemo(() => ({
        learned: themeColors.accent || themeColors.caramelBrown,
        mastered: themeColors.secondary || themeColors.deepMilkTea,
        grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#eee',
        ticks: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : themeColors.accent || themeColors.caramelBrown,
        background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)',
        pieColors: [
            themeColors.accent || themeColors.caramelBrown,
            themeColors.secondary || themeColors.deepMilkTea,
            themeColors.tertiary || themeColors.lightMilkTea
        ]
    }), [themeColors, isDarkMode]);

    // 在useEffect中更新分布数据的颜色以响应主题变化
    useEffect(() => {
        if (distributionData.length > 0) {
            setDistributionData(prevData =>
                prevData.map((item, index) => ({
                    ...item,
                    color: index === 0
                        ? themeColors.accent || themeColors.caramelBrown
                        : index === 1
                            ? themeColors.secondary || themeColors.deepMilkTea
                            : themeColors.tertiary || themeColors.lightMilkTea
                }))
            );
        }
    }, [
        colorScheme,
        themeColors,
        distributionData.length,
        themeColors.accent,
        themeColors.caramelBrown,
        themeColors.secondary,
        themeColors.deepMilkTea,
        themeColors.tertiary,
        themeColors.lightMilkTea
    ]);

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
                        justifyContent: 'center',
                        color: themeColors.text,
                        background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    <AssessmentIcon sx={{
                        mr: 1.5,
                        fontSize: '2rem',
                        color: themeColors.accent || '#A67C52'
                    }} />
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
                                    startColor={themeColors.accent || themeColors.caramelBrown}
                                    endColor={themeColors.secondary || themeColors.deepMilkTea}
                                    animationDelay={0.1}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="已学习"
                                    value={stats.totalLearnedCount || 0}
                                    unit="个"
                                    icon={LocalLibraryIcon}
                                    startColor={themeColors.secondary || themeColors.deepMilkTea}
                                    endColor={themeColors.tertiary || themeColors.lightMilkTea}
                                    animationDelay={0.2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="已掌握"
                                    value={stats.masteredCount || 0}
                                    unit="个"
                                    icon={EmojiEventsIcon}
                                    startColor={themeColors.accent || themeColors.caramelBrown}
                                    endColor={themeColors.tertiary || themeColors.lightMilkTea}
                                    animationDelay={0.3}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="学习天数"
                                    value={stats.learningDays || 0}
                                    unit="天"
                                    icon={CalendarTodayIcon}
                                    startColor={themeColors.tertiary || themeColors.lightMilkTea}
                                    endColor={themeColors.secondary || themeColors.deepMilkTea}
                                    animationDelay={0.4}
                                />
                            </Grid>
                        </Grid>
                    </Fade>

                    {/* 进度条统计和热力值 */}
                    <Slide direction="up" in={true} timeout={1000} mountOnEnter>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={4}>
                                <ProgressCard
                                    title="总体学习进度"
                                    value={stats.totalLearnedCount || 0}
                                    maxValue={stats.totalWordCount || 1}
                                    unit="个"
                                    icon={TrendingUpIcon}
                                    animationDelay={0.5}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <ProgressCard
                                    title="已掌握比例"
                                    value={stats.masteredCount || 0}
                                    maxValue={stats.totalLearnedCount || 1}
                                    unit="个"
                                    icon={SchoolIcon}
                                    bgGradient={`linear-gradient(90deg, ${themeColors.accent || themeColors.caramelBrown}, ${themeColors.tertiary || themeColors.lightMilkTea})`}
                                    animationDelay={0.6}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <StatCard
                                    title="连续学习天数"
                                    value={stats.currentStreak || 0}
                                    unit="天"
                                    icon={WhatshotIcon}
                                    startColor={themeColors.accent || themeColors.caramelBrown}
                                    endColor={themeColors.secondary || themeColors.deepMilkTea}
                                    animationDelay={0.7}
                                />
                            </Grid>
                        </Grid>
                    </Slide>

                    {/* 推荐区域：学习建议和薄弱单词 */}
                    <Slide direction="up" in={true} timeout={1000} mountOnEnter>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={6}>
                                <SuggestionCard
                                    suggestions={stats.suggestions || []}
                                    animationDelay={0.8}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <WeakWordsCard animationDelay={0.8} />
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
                            backgroundColor: `${themeColors.light} !important`, // 修改：使用light色，并添加!important确保样式不被覆盖
                            boxShadow: themeColors.boxShadow, // 使用主题定义的阴影
                        }}
                        className="card-neumorphic"
                        component={Paper} // 显式指定为Paper组件
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                aria-label="统计图表选项卡"
                                variant="fullWidth"
                                sx={{
                                    backgroundColor: themeColors.primary, // 应用主题背景色到选项卡
                                    '& .MuiTab-root': {
                                        py: 2,
                                        transition: 'all 0.3s ease',
                                    },
                                    '& .Mui-selected': {
                                        color: `${themeColors.accent || themeColors.caramelBrown} !important`,
                                        fontWeight: 'bold',
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: themeColors.accent || themeColors.caramelBrown,
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
                                    color: themeColors.accent || themeColors.caramelBrown
                                }}
                            >
                                最近15天学习情况
                            </Typography>

                            {dailyStats && dailyStats.length > 0 ? (
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
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fill: chartColors.ticks }}
                                                axisLine={{ stroke: chartColors.ticks }}
                                            />
                                            <YAxis
                                                tick={{ fill: chartColors.ticks }}
                                                axisLine={{ stroke: chartColors.ticks }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: chartColors.background }}
                                                contentStyle={{
                                                    borderRadius: '10px',
                                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                    border: 'none',
                                                    backgroundColor: isDarkMode ? '#333' : '#fff',
                                                    color: isDarkMode ? '#fff' : 'inherit'
                                                }}
                                                labelStyle={{
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
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
                            ) : (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 300,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 3,
                                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <LocalLibraryIcon
                                        sx={{
                                            fontSize: '3rem',
                                            color: themeColors.accent || themeColors.caramelBrown,
                                            opacity: 0.5,
                                            mb: 2
                                        }}
                                    />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: themeColors.accent || themeColors.caramelBrown,
                                            fontWeight: 'medium',
                                            mb: 1
                                        }}
                                    >
                                        暂无学习数据
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                                            textAlign: 'center',
                                            maxWidth: '80%'
                                        }}
                                    >
                                        开始学习后，这里将显示您的学习进度图表。每天坚持学习，您将看到自己的进步！
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* 每周趋势图表 */}
                        <TabPanel value={tabValue} index={1}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{
                                    mb: 3,
                                    fontWeight: 'bold',
                                    color: themeColors.accent || themeColors.caramelBrown
                                }}
                            >
                                每周学习趋势
                            </Typography>

                            {weeklyStats && weeklyStats.length > 0 ? (
                                <Box sx={{ width: '100%', height: 380, p: 1 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={weeklyStats}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis
                                                dataKey="week"
                                                axisLine={{ stroke: chartColors.ticks }}
                                                tickLine={{ stroke: chartColors.ticks }}
                                                tick={(props) => {
                                                    const { x, y, payload } = props;
                                                    // 查找该周的起始和结束日期
                                                    const item = weeklyStats.find(item => item.week === payload.value);
                                                    // 如果数据中有startDate和endDate字段，使用这些日期
                                                    // 否则使用dateRange字段（如果有）
                                                    let dateText = '';
                                                    if (item?.startDate && item?.endDate) {
                                                        const startParts = item.startDate.split('-');
                                                        const endParts = item.endDate.split('-');
                                                        // 只显示月和日，格式为：M.D-M.D
                                                        if (startParts.length >= 3 && endParts.length >= 3) {
                                                            dateText = `${startParts[1]}.${startParts[2]}-${endParts[1]}.${endParts[2]}`;
                                                        }
                                                    } else if (item?.dateRange) {
                                                        dateText = item.dateRange;
                                                    }

                                                    // 重新定制的周标签，添加日期范围
                                                    return (
                                                        <g transform={`translate(${x},${y+10})`}>
                                                            <text
                                                                x={0}
                                                                y={0}
                                                                dy={16}
                                                                textAnchor="middle"
                                                                fill={chartColors.ticks}
                                                                fontWeight="bold"
                                                            >
                                                                {payload.value}
                                                            </text>
                                                            <text
                                                                x={0}
                                                                y={0}
                                                                dy={40}
                                                                textAnchor="middle"
                                                                fill={chartColors.ticks}
                                                                fontSize="12"
                                                            >
                                                                {dateText}
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                                height={60}
                                            />
                                            <YAxis
                                                tick={{ fill: chartColors.ticks }}
                                                axisLine={{ stroke: chartColors.ticks }}
                                                tickLine={{ stroke: chartColors.ticks }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '10px',
                                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                    border: 'none',
                                                    backgroundColor: isDarkMode ? '#333' : '#fff',
                                                    color: isDarkMode ? '#fff' : 'inherit'
                                                }}
                                                labelStyle={{
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
                                                }}
                                                labelFormatter={(label) => {
                                                    const item = weeklyStats.find(item => item.week === label);
                                                    let dateText = '';
                                                    if (item?.startDate && item?.endDate) {
                                                        dateText = `${item.startDate} ~ ${item.endDate}`;
                                                    } else if (item?.dateRange) {
                                                        dateText = item.dateRange;
                                                    }
                                                    return dateText ? `${label} (${dateText})` : label;
                                                }}
                                                formatter={(value, name) => {
                                                    return [`${value} 个`, name === 'learned' ? '新学单词' : '掌握单词'];
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{ paddingTop: 15 }}
                                                formatter={(value) => (value === 'learned' ? '新学单词' : '掌握单词')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="learned"
                                                name="learned"
                                                stroke={chartColors.learned}
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: chartColors.learned }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="mastered"
                                                name="mastered"
                                                stroke={chartColors.mastered}
                                                strokeWidth={2}
                                                dot={{ r: 4, fill: chartColors.mastered }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 380,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 3,
                                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <TrendingUpIcon
                                        sx={{
                                            fontSize: '3rem',
                                            color: themeColors.accent || themeColors.caramelBrown,
                                            opacity: 0.5,
                                            mb: 2
                                        }}
                                    />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: themeColors.accent || themeColors.caramelBrown,
                                            fontWeight: 'medium',
                                            mb: 1
                                        }}
                                    >
                                        暂无周度数据
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                                            textAlign: 'center',
                                            maxWidth: '80%'
                                        }}
                                    >
                                        坚持一周的学习后，这里将显示您的学习趋势图表。持续学习，您将看到长期进步！
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* 单词分布图表 */}
                        <TabPanel value={tabValue} index={2}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{
                                    mb: 3,
                                    fontWeight: 'bold',
                                    color: themeColors.accent || themeColors.caramelBrown
                                }}
                            >
                                单词学习状态分布
                            </Typography>

                            {distributionData && distributionData.length > 0 && distributionData.some(item => item.value > 1) ? (
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
                                                    border: 'none',
                                                    backgroundColor: isDarkMode ? '#333' : '#fff',
                                                    color: isDarkMode ? '#fff' : 'inherit'
                                                }}
                                                labelStyle={{
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'inherit'
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: 300,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 3,
                                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <AssessmentIcon
                                        sx={{
                                            fontSize: '3rem',
                                            color: themeColors.accent || themeColors.caramelBrown,
                                            opacity: 0.5,
                                            mb: 2
                                        }}
                                    />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: themeColors.accent || themeColors.caramelBrown,
                                            fontWeight: 'medium',
                                            mb: 1
                                        }}
                                    >
                                        暂无单词分布数据
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary',
                                            textAlign: 'center',
                                            maxWidth: '80%'
                                        }}
                                    >
                                        开始学习后，这里将显示您的单词掌握情况分布。继续学习，您将看到更多已掌握的单词！
                                    </Typography>
                                </Box>
                            )}
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
                                background: `linear-gradient(90deg, ${themeColors.accent || themeColors.caramelBrown}, ${themeColors.secondary || themeColors.deepMilkTea})`,
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