import React, { useState, useEffect } from 'react';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SpeedIcon from '@mui/icons-material/Speed';
import SchoolIcon from '@mui/icons-material/School';
import RepeatIcon from '@mui/icons-material/Repeat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

function ReportsPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [periodType, setPeriodType] = useState('last7days'); // 默认显示近7天数据
    const { isAuthenticated } = useAuth();
    const { theme, colorScheme } = useTheme();
    const isDarkMode = theme === 'dark';
    
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

    // 时间段选项
    const timeRangeOptions = [
        { value: 'last7days', label: '近7天', icon: <CalendarTodayIcon /> },
        { value: 'weekly', label: '上周', icon: <DateRangeIcon /> },
        { value: 'thisMonth', label: '本月', icon: <EventNoteIcon /> },
        { value: 'allTime', label: '所有', icon: <AllInclusiveIcon /> }
    ];

    // 处理时间范围变更
    const handlePeriodChange = (event, newPeriod) => {
        if (newPeriod !== null) {
            setPeriodType(newPeriod);
        }
    };

    useEffect(() => {
        const fetchReport = async () => {
            if (!isAuthenticated) {
                setError("请先登录查看学习报告。");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                // 获取报告数据，根据选择的时间范围
                const data = await apiFetch(`/api/statistics/report?type=${periodType}`);
                setReport(data);
            } catch (err) {
                setError(`获取学习报告失败: ${err.message}`);
                setReport(null);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [isAuthenticated, periodType]); // 依赖认证状态和选择的时间段

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in">
                <div className="spinner" style={{ width: 60, height: 60 }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'medium', color: 'text.secondary' }}>
                    正在加载学习报告...
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" className="animate-fade-in">
                <Alert
                    severity="error"
                    sx={{
                        mt: 4,
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(211, 47, 47, 0.15)'
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {error}
                    </Typography>
                </Alert>
            </Container>
        );
    }

    if (!report) {
        return (
            <Container maxWidth="md" className="animate-fade-in">
                <Box
                    sx={{
                        mt: 4,
                        p: 4,
                        textAlign: 'center',
                        borderRadius: '16px'
                    }}
                    className="card-glass"
                >
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        无法加载报告数据
                    </Typography>
                </Box>
            </Container>
        );
    }

    // 正常显示报告
    return (
        <Container maxWidth="md" className="animate-fade-in">
            <Box sx={{ mt: 4, mb: 3 }}>
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
                    学习报告 ({report.periodTitle || '报告'})
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                    sx={{
                        textAlign: 'center',
                        mt: 1
                    }}
                >
                    报告周期: {report.startDate} ~ {report.endDate}
                </Typography>
            </Box>

            {/* 时间范围选择器 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <ToggleButtonGroup
                    value={periodType}
                    exclusive
                    onChange={handlePeriodChange}
                    aria-label="时间范围选择"
                    sx={{
                        '& .MuiToggleButton-root': {
                            borderRadius: '8px',
                            mx: 0.5,
                            px: 2,
                            py: 1,
                            color: 'text.secondary',
                            borderColor: `rgba(${isDarkMode ? '196, 164, 132' : '166, 124, 82'}, 0.2)`,
                            '&.Mui-selected': {
                                color: earthToneColors.caramelBrown,
                                backgroundColor: `rgba(${isDarkMode ? '196, 164, 132' : '166, 124, 82'}, 0.1)`,
                                '&:hover': {
                                    backgroundColor: `rgba(${isDarkMode ? '196, 164, 132' : '166, 124, 82'}, 0.15)`
                                }
                            },
                            '&:hover': {
                                backgroundColor: `rgba(${isDarkMode ? '196, 164, 132' : '166, 124, 82'}, 0.05)`
                            }
                        }
                    }}
                >
                    {timeRangeOptions.map(option => (
                        <ToggleButton
                            key={option.value}
                            value={option.value}
                            aria-label={option.label}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                '&.Mui-selected': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px rgba(${isDarkMode ? '196, 164, 132' : '166, 124, 82'}, 0.2)`
                                }
                            }}
                        >
                            {option.icon}
                            <Typography sx={{ ml: { xs: 0, sm: 1 }, mt: { xs: 0.5, sm: 0 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {option.label}
                            </Typography>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            <Fade in={true} timeout={800}>
                <Card
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4,
                        backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
                    }}
                    component={Paper} // 显式指定为Paper组件
                >
                    {/* 装饰条纹 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: isDarkMode 
                                ? `linear-gradient(90deg, ${earthToneColors.caramelBrown}, ${earthToneColors.milkCoffee})`
                                : `linear-gradient(90deg, ${earthToneColors.caramelBrown}, ${earthToneColors.deepMilkTea})`,
                            opacity: 0.7
                        }}
                    />

                    <CardContent sx={{ p: 4 }}>
                        <Typography
                            variant="h5"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                color: earthToneColors.caramelBrown
                            }}
                        >
                            <SpeedIcon sx={{ mr: 1.5 }} />
                            关键指标
                        </Typography>

                        <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
                            <Grid item xs={12} sm={4}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        background: `rgba(${isDarkMode ? '125, 91, 61' : '166, 124, 82'}, 0.1)`,
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: `0 10px 20px rgba(${isDarkMode ? '125, 91, 61' : '166, 124, 82'}, 0.2)`
                                        }
                                    }}
                                >
                                    <RepeatIcon
                                        sx={{
                                            fontSize: '2.5rem',
                                            color: earthToneColors.caramelBrown,
                                            mb: 1
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: earthToneColors.caramelBrown
                                        }}
                                    >
                                        {report.summary?.totalReviews || 0}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontWeight: 'medium' }}
                                    >
                                        总复习次数
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        background: `rgba(${isDarkMode ? '120, 87, 49' : '210, 180, 140'}, 0.1)`,
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: `0 10px 20px rgba(${isDarkMode ? '120, 87, 49' : '210, 180, 140'}, 0.2)`
                                        }
                                    }}
                                >
                                    <SchoolIcon
                                        sx={{
                                            fontSize: '2.5rem',
                                            color: earthToneColors.deepMilkTea,
                                            mb: 1
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: earthToneColors.deepMilkTea
                                        }}
                                    >
                                        {report.summary?.wordsReviewedCount || 0}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontWeight: 'medium' }}
                                    >
                                        复习单词数
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        background: `rgba(${isDarkMode ? '196, 164, 132' : '196, 164, 132'}, 0.1)`,
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: `0 10px 20px rgba(${isDarkMode ? '196, 164, 132' : '196, 164, 132'}, 0.2)`
                                        }
                                    }}
                                >
                                    <CheckCircleIcon
                                        sx={{
                                            fontSize: '2.5rem',
                                            color: earthToneColors.milkCoffee,
                                            mb: 1
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: earthToneColors.milkCoffee
                                        }}
                                    >
                                        {report.masteredInPeriod || 0}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontWeight: 'medium' }}
                                    >
                                        期间新掌握
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Fade>

            <Fade in={true} timeout={1000}>
                <Card
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4,
                        backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
                    }}
                    component={Paper} // 显式指定为Paper组件
                >
                    {/* 装饰条纹 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: isDarkMode 
                                ? `linear-gradient(90deg, ${earthToneColors.deepMilkTea}, ${earthToneColors.caramelBrown})`
                                : `linear-gradient(90deg, ${earthToneColors.milkCoffee}, ${earthToneColors.caramelBrown})`,
                            opacity: 0.7
                        }}
                    />

                    <CardContent sx={{ p: 4 }}>
                        <Typography
                            variant="h5"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                color: earthToneColors.milkCoffee
                            }}
                        >
                            <WarningIcon sx={{ mr: 1.5 }} />
                            薄弱单词提醒
                        </Typography>

                        {report.topWeakWords && report.topWeakWords.length > 0 ? (
                            <List sx={{ mt: 2 }}>
                                {report.topWeakWords.map((item, index) => (
                                    <Zoom
                                        in={true}
                                        style={{
                                            transitionDelay: `${index * 100}ms`,
                                        }}
                                        key={index}
                                    >
                                        <ListItem
                                            sx={{
                                                mb: 1,
                                                p: 2,
                                                borderRadius: '12px',
                                                background: `rgba(${isDarkMode ? '196, 164, 132' : '196, 164, 132'}, 0.05)`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    background: `rgba(${isDarkMode ? '196, 164, 132' : '196, 164, 132'}, 0.1)`,
                                                    transform: 'translateX(5px)'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <WarningIcon sx={{ color: earthToneColors.milkCoffee }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: earthToneColors.milkCoffee
                                                        }}
                                                    >
                                                        {item.spelling}
                                                    </Typography>
                                                }
                                                secondary={item.meaning || 'N/A'}
                                            />
                                            <Chip
                                                label={`错误率: ${Math.round(item.errorRate * 100)}%`}
                                                sx={{
                                                    borderRadius: '16px',
                                                    background: `rgba(${isDarkMode ? '166, 124, 82' : '166, 124, 82'}, 0.1)`,
                                                    color: earthToneColors.caramelBrown,
                                                    fontWeight: 'medium',
                                                    border: 'none'
                                                }}
                                            />
                                        </ListItem>
                                    </Zoom>
                                ))}
                            </List>
                        ) : (
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    background: `rgba(${isDarkMode ? '166, 124, 82' : '166, 124, 82'}, 0.05)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 2
                                }}
                            >
                                <CheckCircleIcon
                                    sx={{
                                        color: earthToneColors.caramelBrown,
                                        fontSize: '2rem',
                                        mr: 2
                                    }}
                                />
                                <Typography sx={{ color: earthToneColors.caramelBrown, fontWeight: 'medium' }}>
                                    表现不错，所选时间段内没有发现需要特别注意的薄弱单词！
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Fade>

            <Fade in={true} timeout={1200}>
                <Card
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4,
                        backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
                    }}
                    component={Paper} // 显式指定为Paper组件
                >
                    {/* 装饰条纹 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: isDarkMode 
                                ? `linear-gradient(90deg, ${earthToneColors.milkCoffee}, ${earthToneColors.deepMilkTea})`
                                : `linear-gradient(90deg, ${earthToneColors.deepMilkTea}, ${earthToneColors.milkCoffee})`,
                            opacity: 0.7
                        }}
                    />

                    <CardContent sx={{ p: 4 }}>
                        <Typography
                            variant="h5"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                color: earthToneColors.deepMilkTea
                            }}
                        >
                            <LightbulbIcon sx={{ mr: 1.5 }} />
                            学习建议
                        </Typography>

                        {report.suggestions && report.suggestions.length > 0 ? (
                            <List sx={{ mt: 2 }}>
                                {report.suggestions.map((suggestion, index) => (
                                    <Zoom
                                        in={true}
                                        style={{
                                            transitionDelay: `${index * 100}ms`,
                                        }}
                                        key={index}
                                    >
                                        <ListItem
                                            sx={{
                                                mb: 1,
                                                p: 2,
                                                borderRadius: '12px',
                                                background: `rgba(${isDarkMode ? '210, 180, 140' : '210, 180, 140'}, 0.05)`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    background: `rgba(${isDarkMode ? '210, 180, 140' : '210, 180, 140'}, 0.1)`,
                                                    transform: 'translateX(5px)'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <LightbulbIcon sx={{ color: earthToneColors.deepMilkTea }} />
                                            </ListItemIcon>
                                            <Typography variant="body1">{suggestion}</Typography>
                                        </ListItem>
                                    </Zoom>
                                ))}
                            </List>
                        ) : (
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    background: `rgba(${isDarkMode ? '166, 124, 82' : '166, 124, 82'}, 0.05)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 2
                                }}
                            >
                                <CheckCircleIcon
                                    sx={{
                                        color: earthToneColors.caramelBrown,
                                        fontSize: '2rem',
                                        mr: 2
                                    }}
                                />
                                <Typography sx={{ color: earthToneColors.caramelBrown, fontWeight: 'medium' }}>
                                    暂无特别建议，请继续保持！
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Fade>
        </Container>
    );
}

export default ReportsPage;