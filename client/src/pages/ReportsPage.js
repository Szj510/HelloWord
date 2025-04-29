import React, { useState, useEffect } from 'react';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SpeedIcon from '@mui/icons-material/Speed';
import SchoolIcon from '@mui/icons-material/School';
import RepeatIcon from '@mui/icons-material/Repeat';

function ReportsPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();

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
                // 获取周报数据
                const data = await apiFetch('/api/statistics/report?type=weekly');
                setReport(data);
            } catch (err) {
                setError(`获取学习报告失败: ${err.message}`);
                setReport(null);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [isAuthenticated]); // 依赖认证状态

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
            <Box sx={{ mt: 4, mb: 5 }}>
                <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    <AssessmentIcon sx={{ mr: 1.5, fontSize: '2rem' }} />
                    学习报告 ({report.periodType === 'weekly' ? '上周总结' : '报告'})
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

            <Fade in={true} timeout={800}>
                <Card
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4
                    }}
                >
                    {/* 装饰条纹 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
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
                                color: '#4776E6'
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
                                        background: 'rgba(71, 118, 230, 0.1)',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 10px 20px rgba(71, 118, 230, 0.2)'
                                        }
                                    }}
                                >
                                    <RepeatIcon
                                        sx={{
                                            fontSize: '2.5rem',
                                            color: '#4776E6',
                                            mb: 1
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#4776E6'
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
                                        background: 'rgba(142, 84, 233, 0.1)',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 10px 20px rgba(142, 84, 233, 0.2)'
                                        }
                                    }}
                                >
                                    <SchoolIcon
                                        sx={{
                                            fontSize: '2.5rem',
                                            color: '#8E54E9',
                                            mb: 1
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#8E54E9'
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
                                        background: 'rgba(76, 175, 80, 0.1)',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 10px 20px rgba(76, 175, 80, 0.2)'
                                        }
                                    }}
                                >
                                    <CheckCircleIcon
                                        sx={{
                                            fontSize: '2.5rem',
                                            color: '#4CAF50',
                                            mb: 1
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#4CAF50'
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
                        mb: 4
                    }}
                >
                    {/* 装饰条纹 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: 'linear-gradient(90deg, #FF9800, #FF5722)',
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
                                color: '#FF9800'
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
                                                background: 'rgba(255, 152, 0, 0.05)',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    background: 'rgba(255, 152, 0, 0.1)',
                                                    transform: 'translateX(5px)'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <WarningIcon sx={{ color: '#FF9800' }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: '#FF9800'
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
                                                    background: 'rgba(244, 67, 54, 0.1)',
                                                    color: '#f44336',
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
                                    background: 'rgba(76, 175, 80, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 2
                                }}
                            >
                                <CheckCircleIcon
                                    sx={{
                                        color: '#4CAF50',
                                        fontSize: '2rem',
                                        mr: 2
                                    }}
                                />
                                <Typography sx={{ color: '#4CAF50', fontWeight: 'medium' }}>
                                    表现不错，上周没有发现需要特别注意的薄弱单词！
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
                        mb: 4
                    }}
                >
                    {/* 装饰条纹 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: 'linear-gradient(90deg, #03A9F4, #00BCD4)',
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
                                color: '#03A9F4'
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
                                                background: 'rgba(3, 169, 244, 0.05)',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    background: 'rgba(3, 169, 244, 0.1)',
                                                    transform: 'translateX(5px)'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <LightbulbIcon sx={{ color: '#03A9F4' }} />
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
                                    background: 'rgba(76, 175, 80, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: 2
                                }}
                            >
                                <CheckCircleIcon
                                    sx={{
                                        color: '#4CAF50',
                                        fontSize: '2rem',
                                        mr: 2
                                    }}
                                />
                                <Typography sx={{ color: '#4CAF50', fontWeight: 'medium' }}>
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