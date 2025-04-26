import React, { useState, useEffect } from 'react';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';

// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper'; // 用 Paper 作为报告容器
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
// import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // 图标
// import WarningIcon from '@mui/icons-material/Warning';
// import LightbulbIcon from '@mui/icons-material/Lightbulb';

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
        return ( <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> );
    }
    if (error) {
        return ( <Container maxWidth="sm"><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container> );
    }
    if (!report) {
        return ( <Container maxWidth="md"><Typography sx={{mt: 4}}>无法加载报告数据。</Typography></Container> );
    }

    // 正常显示报告
    return (
        <Container maxWidth="md">
            <Typography component="h1" variant="h4" gutterBottom sx={{ my: 2 }}>
                学习报告 ({report.periodType === 'weekly' ? '上周总结' : '报告'})
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                报告周期: {report.startDate} ~ {report.endDate}
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mt: 2 }}> {/* 使用 Paper 包裹内容 */}
                <Typography variant="h5" gutterBottom>关键指标</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="h6">{report.summary?.totalReviews || 0}</Typography>
                        <Typography color="text.secondary">总复习次数</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                         <Typography variant="h6">{report.summary?.wordsReviewedCount || 0}</Typography>
                         <Typography color="text.secondary">复习单词数</Typography>
                     </Grid>
                     <Grid item xs={6} sm={4}>
                         <Typography variant="h6">{report.masteredInPeriod || 0}</Typography>
                         <Typography color="text.secondary">期间新掌握</Typography>
                     </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h5" gutterBottom>薄弱单词提醒</Typography>
                {report.topWeakWords && report.topWeakWords.length > 0 ? (
                    <List dense>
                        {report.topWeakWords.map((item, index) => (
                            <ListItem key={index}>
                                 {/* <ListItemIcon><WarningIcon color="warning" /></ListItemIcon> */}
                                <ListItemText
                                    primary={item.spelling}
                                    secondary={item.meaning || 'N/A'}
                                />
                                <Chip
                                     label={`错误率: ${Math.round(item.errorRate * 100)}%`}
                                     color="error"
                                     size="small"
                                     variant="outlined"
                                 />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary" sx={{mb: 3}}>表现不错，上周没有发现需要特别注意的薄弱单词！</Typography>
                )}


                <Divider sx={{ my: 3 }} />

                 <Typography variant="h5" gutterBottom>学习建议</Typography>
                 {report.suggestions && report.suggestions.length > 0 ? (
                     <List dense>
                         {report.suggestions.map((suggestion, index) => (
                             <ListItem key={index}>
                                 {/* <ListItemIcon><LightbulbIcon color="info" /></ListItemIcon> */}
                                  <Typography variant="body2">{suggestion}</Typography>
                              </ListItem>
                          ))}
                      </List>
                  ) : (
                      <Typography color="text.secondary">暂无特别建议，请继续保持！</Typography>
                  )}

            </Paper>
        </Container>
    );
}

export default ReportsPage;