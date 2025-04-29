import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../utils/api';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
// Icons
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';

dayjs.extend(isSameOrAfter);

function PlanSettingsPage() {
    const [plan, setPlan] = useState(null);
    const [userWordbooks, setUserWordbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        targetWordbookId: '',
        dailyNewWordsTarget: 15,
        dailyReviewWordsTarget: 40,
        planEndDate: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const { isAuthenticated } = useAuth();

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const [wordbookStats, setWordbookStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [suggestion, setSuggestion] = useState({
        endDate: '',
        newWords: '',
        reviewWords: ''
    });

    const showSnackbar = (message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); };
    const handleSnackbarClose = (event, reason) => { if (reason === 'clickaway') { return; } setSnackbarOpen(false); };

    const fetchWordbookStats = useCallback(async (bookId) => {
        if (!bookId) { setWordbookStats(null); return; }
        setLoadingStats(true);
        try {
            const stats = await apiFetch(`/api/wordbooks/${bookId}/stats`);
            setWordbookStats(stats);
        } catch (err) {
            console.error("获取单词书统计失败:", err);
            setWordbookStats(null);
            showSnackbar(`无法获取单词书统计信息: ${err.message}`, 'error');
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true); setError(''); setWordbookStats(null);
        try {
            const [planData, wordbooksData] = await Promise.all([
                apiFetch('/api/plans/current'),
                apiFetch('/api/wordbooks')
            ]);
            const currentPlan = planData.plan;
            const books = wordbooksData || [];
            setPlan(currentPlan);
            setUserWordbooks(books);

            const defaultWordbookId = (books.length > 0) ? books[0]._id : '';
            let initialFormState = {
                 targetWordbookId: currentPlan?.targetWordbook || defaultWordbookId,
                 dailyNewWordsTarget: currentPlan?.dailyNewWordsTarget || 15,
                 dailyReviewWordsTarget: currentPlan?.dailyReviewWordsTarget || 40,
                 planEndDate: currentPlan?.planEndDate ? dayjs(currentPlan.planEndDate).format('YYYY-MM-DD') : ''
            };

            setFormData(initialFormState);
            setIsEditing(currentPlan?.isActive || false);

            if (initialFormState.targetWordbookId) {
                 fetchWordbookStats(initialFormState.targetWordbookId);
            }

        } catch (err) {
            setError(`加载页面数据失败: ${err.message}`);
            setPlan(null);
            setUserWordbooks([]);
        } finally {
            setLoading(false);
        }
    }, [fetchWordbookStats]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        } else {
            setError("请先登录。"); setLoading(false);
        }
    }, [isAuthenticated, fetchData]);

    const calculateSuggestions = useCallback((source, value) => {
        if (!wordbookStats || wordbookStats.remainingNewWords <= 0) {
            setSuggestion({ endDate: '', newWords: '', reviewWords: '' });
            return;
        }

        const { remainingNewWords } = wordbookStats;
        let suggestedEndDate = '';
        let suggestedNewWords = formData.dailyNewWordsTarget;
        let suggestedReviewWords = formData.dailyReviewWordsTarget;

        if (source === 'endDate' && value) {
            const endDate = dayjs(value);
            const today = dayjs().startOf('day');
            if (endDate.isSameOrAfter(today)) {
                const daysRemaining = endDate.diff(today, 'day') + 1;
                 if (daysRemaining > 0) {
                    suggestedNewWords = Math.ceil(remainingNewWords / daysRemaining);
                     suggestedReviewWords = Math.max(20, suggestedNewWords * 2);
                      setSuggestion({ endDate: '', newWords: `建议每天学 ${suggestedNewWords} 个新词`, reviewWords: `建议每天复习 ${suggestedReviewWords} 个单词` });
                      setFormData(prev => ({ ...prev, dailyNewWordsTarget: suggestedNewWords, dailyReviewWordsTarget: suggestedReviewWords }));

                 } else {
                      setSuggestion({ endDate: '结束日期无效', newWords: '', reviewWords: '' });
                  }
            } else {
                  setSuggestion({ endDate: '结束日期必须在今天或之后', newWords: '', reviewWords: '' });
             }
        } else if (source === 'newWords' && value) {
             const dailyNew = parseInt(value, 10);
             if (!isNaN(dailyNew) && dailyNew > 0) {
                 const daysNeeded = Math.ceil(remainingNewWords / dailyNew);
                 suggestedEndDate = dayjs().add(daysNeeded - 1, 'day').format('YYYY-MM-DD');
                  suggestedReviewWords = Math.max(20, dailyNew * 2);
                  setSuggestion({ endDate: `预计 ${suggestedEndDate} 完成`, newWords: '', reviewWords: `建议每天复习 ${suggestedReviewWords} 个单词` });
                  setFormData(prev => ({ ...prev, planEndDate: suggestedEndDate, dailyReviewWordsTarget: suggestedReviewWords }));

             } else {
                   setSuggestion({ endDate: '', newWords: '请输入有效的新词数量', reviewWords: '' });
               }
        } else {
              setSuggestion({ endDate: '', newWords: '', reviewWords: '' });
         }

    }, [wordbookStats, formData.dailyNewWordsTarget, formData.dailyReviewWordsTarget]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        let updatedValue = value;

        if (name === 'dailyNewWordsTarget' || name === 'dailyReviewWordsTarget') {
            const numValue = parseInt(value, 10);
            updatedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
        }
        setFormData(prev => ({ ...prev, [name]: updatedValue }));

         if (name === 'planEndDate') setSuggestion(prev => ({...prev, endDate: ''}));
         if (name === 'dailyNewWordsTarget') setSuggestion(prev => ({...prev, newWords: ''}));
         if (name === 'dailyReviewWordsTarget') setSuggestion(prev => ({...prev, reviewWords: ''}));

        if (name === 'targetWordbookId') {
            fetchWordbookStats(value);
            setSuggestion({ endDate: '', newWords: '', reviewWords: '' });
            setFormData(prev => ({
                ...prev,
                dailyNewWordsTarget: 15,
                dailyReviewWordsTarget: 40,
                planEndDate: ''
            }));
        }
         else if ((name === 'planEndDate' || name === 'dailyNewWordsTarget') && wordbookStats) {
            if(name === 'planEndDate' && value) {
                 calculateSuggestions('endDate', value);
            } else if (name === 'dailyNewWordsTarget') {
                 const numValue = parseInt(value, 10);
                 if (!isNaN(numValue) && numValue > 0) {
                     calculateSuggestions('newWords', value);
                 } else {
                      setSuggestion(prev => ({ ...prev, endDate: '', reviewWords: ''}));
                  }
             }
         }
    };

    const handleSavePlan = async () => {
         if (!formData.targetWordbookId) {
             showSnackbar("请选择一个目标单词书", "warning");
             return;
         }
        setIsSaving(true); setError('');
        try {
            const payload = { ...formData };
             if (!payload.planEndDate) {
                 delete payload.planEndDate;
             }

            const updatedPlanData = await apiFetch('/api/plans', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            setPlan(updatedPlanData.plan);
            setIsEditing(true);
            showSnackbar("学习计划已成功保存并激活！", "success");
        } catch (err) {
            setError(`保存计划失败: ${err.message}`);
            showSnackbar(`保存计划失败: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivatePlan = async () => {
         if (!plan || !plan.isActive) return;
         if (!window.confirm("确定要停用当前的学习计划吗？")) return;

        setIsSaving(true); setError('');
         try {
             const updatedPlanData = await apiFetch('/api/plans/current', { method: 'DELETE' });
             setPlan(updatedPlanData.plan);
             setIsEditing(false);
             showSnackbar("学习计划已停用。", "info");
         } catch (err) {
              setError(`停用计划失败: ${err.message}`);
              showSnackbar(`停用计划失败: ${err.message}`, "error");
          } finally {
              setIsSaving(false);
          }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in">
                <div className="spinner" style={{ width: 60, height: 60 }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'medium', color: 'text.secondary' }}>
                    正在加载学习计划...
                </Typography>
            </Container>
        );
    }

    if (error && !plan) {
        return (
            <Container maxWidth="md" className="animate-fade-in">
                <Alert
                    severity="error"
                    sx={{
                        mt: 4,
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(211, 47, 47, 0.15)'
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>加载失败</Typography>
                    <Typography>{error}</Typography>
                </Alert>
                <Button
                    variant="contained"
                    sx={{
                        mt: 2,
                        borderRadius: '50px',
                        py: 1,
                        px: 3,
                        background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                        boxShadow: '0 8px 16px rgba(71, 118, 230, 0.3)',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 12px 20px rgba(71, 118, 230, 0.4)',
                            transform: 'translateY(-3px)'
                        },
                    }}
                    onClick={fetchData}
                >
                    重试
                </Button>
            </Container>
        );
    }

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
                    <SettingsIcon sx={{ mr: 1.5, fontSize: '2rem' }} />
                    我的学习计划
                </Typography>
            </Box>

            <Fade in={true} timeout={800}>
                <Card
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        borderRadius: '16px',
                        position: 'relative',
                        overflow: 'hidden'
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
                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 3,
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 15px rgba(211, 47, 47, 0.15)'
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        {plan && plan.isActive && (
                            <Box
                                sx={{
                                    mb: 4,
                                    p: 2,
                                    borderRadius: '12px',
                                    background: 'rgba(76, 175, 80, 0.1)',
                                    border: '1px solid rgba(76, 175, 80, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 2
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#4CAF50',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <SpeedIcon sx={{ mr: 1 }} />
                                        当前学习计划已激活
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                        每日新词: <strong>{plan.dailyNewWordsTarget}</strong> 个 |
                                        每日复习: <strong>{plan.dailyReviewWordsTarget}</strong> 个
                                        {plan.planEndDate && ` | 目标完成日期: ${dayjs(plan.planEndDate).format('YYYY-MM-DD')}`}
                                    </Typography>
                                </Box>
                                <Chip
                                    label="已激活"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 'medium' }}
                                />
                            </Box>
                        )}

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <FormControl
                                    fullWidth
                                    required
                                    error={!formData.targetWordbookId && isEditing}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.5)'
                                        }
                                    }}
                                >
                                    <InputLabel id="target-wordbook-label">目标单词书</InputLabel>
                                    <Select
                                        labelId="target-wordbook-label"
                                        name="targetWordbookId"
                                        value={formData.targetWordbookId}
                                        onChange={handleFormChange}
                                    >
                                        {userWordbooks.map(book => (
                                            <MenuItem key={book._id} value={book._id}>
                                                {book.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {wordbookStats && !loadingStats && (
                                        <FormHelperText>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                <Chip
                                                    size="small"
                                                    label={`总词数: ${wordbookStats.totalWords}`}
                                                    sx={{
                                                        borderRadius: '16px',
                                                        background: 'rgba(71, 118, 230, 0.1)',
                                                        color: '#4776E6',
                                                        fontWeight: 'medium'
                                                    }}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`已学: ${wordbookStats.learnedWordsCount}`}
                                                    sx={{
                                                        borderRadius: '16px',
                                                        background: 'rgba(142, 84, 233, 0.1)',
                                                        color: '#8E54E9',
                                                        fontWeight: 'medium'
                                                    }}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`剩余新词: ${wordbookStats.remainingNewWords}`}
                                                    sx={{
                                                        borderRadius: '16px',
                                                        background: 'rgba(76, 175, 80, 0.1)',
                                                        color: '#4CAF50',
                                                        fontWeight: 'medium'
                                                    }}
                                                />
                                            </Box>
                                        </FormHelperText>
                                    )}
                                    {loadingStats && (
                                        <FormHelperText>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                <div className="spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
                                                正在加载单词书信息...
                                            </Box>
                                        </FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="计划结束日期 (可选)"
                                    type="date"
                                    name="planEndDate"
                                    value={formData.planEndDate}
                                    onChange={handleFormChange}
                                    InputLabelProps={{ shrink: true }}
                                    helperText={suggestion.endDate || "设定一个目标完成日期"}
                                    error={!!suggestion.endDate && suggestion.endDate.includes('无效')}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.5)'
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <CalendarTodayIcon
                                                sx={{
                                                    color: '#4776E6',
                                                    mr: 1
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="每日新学单词数"
                                    type="number"
                                    name="dailyNewWordsTarget"
                                    value={formData.dailyNewWordsTarget}
                                    onChange={handleFormChange}
                                    required
                                    helperText={suggestion.newWords || "每天计划学习的新单词数量"}
                                    error={!!suggestion.newWords && suggestion.newWords.includes('无效')}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.5)'
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <SpeedIcon
                                                sx={{
                                                    color: '#4776E6',
                                                    mr: 1
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="每日复习单词数 (上限)"
                                    type="number"
                                    name="dailyReviewWordsTarget"
                                    value={formData.dailyReviewWordsTarget}
                                    onChange={handleFormChange}
                                    required
                                    helperText={suggestion.reviewWords || "每天计划复习的单词数量上限"}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(71, 118, 230, 0.5)'
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <TimerIcon
                                                sx={{
                                                    color: '#4776E6',
                                                    mr: 1
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            {plan && plan.isActive && (
                                <Button
                                    variant="outlined"
                                    onClick={handleDeactivatePlan}
                                    disabled={isSaving}
                                    sx={{
                                        borderRadius: '50px',
                                        py: 1,
                                        px: 3,
                                        borderColor: 'rgba(211, 47, 47, 0.5)',
                                        color: '#d32f2f',
                                        '&:hover': {
                                            borderColor: '#d32f2f',
                                            backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                        }
                                    }}
                                >
                                    {isSaving ? <CircularProgress size={24} /> : '停用计划'}
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleSavePlan}
                                disabled={isSaving || userWordbooks.length === 0}
                                sx={{
                                    borderRadius: '50px',
                                    py: 1,
                                    px: 3,
                                    background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                    boxShadow: '0 8px 16px rgba(71, 118, 230, 0.3)',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: '0 12px 20px rgba(71, 118, 230, 0.4)',
                                        transform: 'translateY(-3px)'
                                    },
                                }}
                            >
                                {isSaving ? <CircularProgress size={24} /> : (plan && plan.isActive ? '更新计划' : '保存并激活计划')}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Fade>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{
                        width: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default PlanSettingsPage;