import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
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
import CardActions from '@mui/material/CardActions';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
// Icons
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import FlagIcon from '@mui/icons-material/Flag';
import LoopIcon from '@mui/icons-material/Loop';
import AddIcon from '@mui/icons-material/Add';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SaveIcon from '@mui/icons-material/Save';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

dayjs.extend(isSameOrAfter);

function PlanSettingsPage() {
    const [plans, setPlans] = useState([]);
    const [activePlan, setActivePlan] = useState(null);
    const [userWordbooks, setUserWordbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [formData, setFormData] = useState({
        targetWordbookId: '',
        dailyNewWordsTarget: 15,
        dailyReviewWordsTarget: 40,
        planEndDate: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const { isAuthenticated } = useAuth();
    const { theme, colorScheme } = useTheme();
    const isDarkMode = theme === 'dark';

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

    const themeColors = getThemeColors();

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

    const [dailyReviewCount, setDailyReviewCount] = useState(40);
    const [dailyNewWordsCount, setDailyNewWordsCount] = useState(15);
    const [reviewModes, setReviewModes] = useState([
        { id: 1, name: '模式一', enabled: true },
        { id: 2, name: '模式二', enabled: false },
        { id: 3, name: '模式三', enabled: true }
    ]);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('08:00');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);

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
            const [plansData, wordbooksData] = await Promise.all([
                apiFetch('/api/plans'),
                apiFetch('/api/wordbooks')
            ]);
            const userPlans = plansData.plans || [];
            const currentActivePlan = userPlans.find(plan => plan.isActive) || null;
            const books = wordbooksData || [];
            
            setPlans(userPlans);
            setActivePlan(currentActivePlan);
            setUserWordbooks(books);

            const defaultWordbookId = (books.length > 0) ? books[0]._id : '';
            let initialFormState = {
                targetWordbookId: currentActivePlan?.targetWordbook || defaultWordbookId,
                dailyNewWordsTarget: currentActivePlan?.dailyNewWordsTarget || 15,
                dailyReviewWordsTarget: currentActivePlan?.dailyReviewWordsTarget || 40,
                planEndDate: currentActivePlan?.planEndDate ? dayjs(currentActivePlan.planEndDate).format('YYYY-MM-DD') : ''
            };

            setFormData(initialFormState);
            setDailyNewWordsCount(initialFormState.dailyNewWordsTarget);
            setDailyReviewCount(initialFormState.dailyReviewWordsTarget);
            setIsEditing(!!currentActivePlan);

            if (initialFormState.targetWordbookId) {
                fetchWordbookStats(initialFormState.targetWordbookId);
            }

        } catch (err) {
            setError(`加载页面数据失败: ${err.message}`);
            setPlans([]);
            setActivePlan(null);
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
                    setDailyNewWordsCount(suggestedNewWords);
                    setDailyReviewCount(suggestedReviewWords);
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
                setDailyReviewCount(suggestedReviewWords);
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
        if (name === 'dailyNewWordsTarget') {
            setSuggestion(prev => ({...prev, newWords: ''}));
            setDailyNewWordsCount(updatedValue);
        }
        if (name === 'dailyReviewWordsTarget') {
            setSuggestion(prev => ({...prev, reviewWords: ''}));
            setDailyReviewCount(updatedValue);
        }

        if (name === 'targetWordbookId') {
            fetchWordbookStats(value);
            setSuggestion({ endDate: '', newWords: '', reviewWords: '' });
            setFormData(prev => ({
                ...prev,
                dailyNewWordsTarget: 15,
                dailyReviewWordsTarget: 40,
                planEndDate: ''
            }));
            setDailyNewWordsCount(15);
            setDailyReviewCount(40);
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

    const handleCreateNewPlan = () => {
        const defaultWordbookId = (userWordbooks.length > 0) ? userWordbooks[0]._id : '';
        setFormData({
            targetWordbookId: defaultWordbookId,
            dailyNewWordsTarget: 15,
            dailyReviewWordsTarget: 40,
            planEndDate: ''
        });
        setDailyNewWordsCount(15);
        setDailyReviewCount(40);
        setIsCreatingNew(true);
        setSelectedTabIndex(plans.length); // 切换到新计划的tab
        if (defaultWordbookId) {
            fetchWordbookStats(defaultWordbookId);
        }
    };

    const handleSelectPlan = (planIndex) => {
        if (planIndex >= 0 && planIndex < plans.length) {
            const selectedPlan = plans[planIndex];
            setFormData({
                targetWordbookId: selectedPlan.targetWordbook || '',
                dailyNewWordsTarget: selectedPlan.dailyNewWordsTarget || 15,
                dailyReviewWordsTarget: selectedPlan.dailyReviewWordsTarget || 40,
                planEndDate: selectedPlan.planEndDate ? dayjs(selectedPlan.planEndDate).format('YYYY-MM-DD') : ''
            });
            setDailyNewWordsCount(selectedPlan.dailyNewWordsTarget || 15);
            setDailyReviewCount(selectedPlan.dailyReviewWordsTarget || 40);
            setIsCreatingNew(false);
            if (selectedPlan.targetWordbook) {
                fetchWordbookStats(selectedPlan.targetWordbook);
            }
        }
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTabIndex(newValue);
        if (newValue === plans.length) {
            handleCreateNewPlan();
        } else {
            handleSelectPlan(newValue);
        }
    };

    const handleSavePlan = async () => {
        if (!formData.targetWordbookId) {
            showSnackbar("请选择一个目标单词书", "warning");
            return;
        }
        setIsSaving(true); setError('');
        try {
            const payload = { 
                ...formData,
                dailyNewWordsTarget: dailyNewWordsCount,
                dailyReviewWordsTarget: dailyReviewCount,
                reminderEnabled: reminderEnabled,
                reminderTime: reminderTime
            };
            if (!payload.planEndDate) {
                delete payload.planEndDate;
            }

            const response = await apiFetch('/api/plans', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            await fetchData(); // 重新加载所有计划
            setIsCreatingNew(false);
            showSnackbar("学习计划已成功保存并激活！", "success");
        } catch (err) {
            setError(`保存计划失败: ${err.message}`);
            showSnackbar(`保存计划失败: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleActivatePlan = async (planId) => {
        if (!planId) return;

        setIsSaving(true); setError('');
        try {
            const response = await apiFetch(`/api/plans/${planId}/activate`, {
                method: 'PUT'
            });

            await fetchData(); // 重新加载所有计划
            showSnackbar("学习计划已成功激活！", "success");
        } catch (err) {
            setError(`激活计划失败: ${err.message}`);
            showSnackbar(`激活计划失败: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!planId || !window.confirm("确定要删除此学习计划吗？")) return;

        setIsSaving(true); setError('');
        try {
            const response = await apiFetch(`/api/plans/${planId}`, {
                method: 'DELETE'
            });

            await fetchData(); // 重新加载所有计划
            setSelectedTabIndex(0); // 切换到第一个计划
            showSnackbar("学习计划已成功删除！", "success");
        } catch (err) {
            setError(`删除计划失败: ${err.message}`);
            showSnackbar(`删除计划失败: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivatePlan = async () => {
        if (!activePlan || !activePlan.isActive) return;
        if (!window.confirm("确定要停用当前的学习计划吗？")) return;

        setIsSaving(true); setError('');
        try {
            const updatedPlanData = await apiFetch('/api/plans/current', { method: 'DELETE' });
            await fetchData(); // 重新加载所有计划
            showSnackbar("学习计划已停用。", "info");
        } catch (err) {
            setError(`停用计划失败: ${err.message}`);
            showSnackbar(`停用计划失败: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleReviewMode = (index) => {
        setReviewModes((prevModes) => {
            const updatedModes = [...prevModes];
            updatedModes[index].enabled = !updatedModes[index].enabled;
            return updatedModes;
        });
    };

    const handleSliderChange = (setter) => (event, newValue) => {
        setter(newValue);
        if (setter === setDailyNewWordsCount) {
            setFormData(prev => ({ ...prev, dailyNewWordsTarget: newValue }));
            if (wordbookStats && newValue > 0) {
                calculateSuggestions('newWords', newValue.toString());
            }
        } else if (setter === setDailyReviewCount) {
            setFormData(prev => ({ ...prev, dailyReviewWordsTarget: newValue }));
        }
    };

    const handleTextInputChange = (setter) => (e) => {
        const numValue = parseInt(e.target.value, 10);
        const validValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
        setter(validValue);
        if (setter === setDailyNewWordsCount) {
            setFormData(prev => ({ ...prev, dailyNewWordsTarget: validValue }));
            if (wordbookStats && validValue > 0) {
                calculateSuggestions('newWords', validValue.toString());
            }
        } else if (setter === setDailyReviewCount) {
            setFormData(prev => ({ ...prev, dailyReviewWordsTarget: validValue }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSavePlan();
    };

    const getWordbookNameById = (wordbookId) => {
        const wordbook = userWordbooks.find(book => book._id === wordbookId);
        return wordbook ? wordbook.name : '未知单词书';
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

    if (error && plans.length === 0) {
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
                        background: `linear-gradient(90deg, ${earthToneColors.caramelBrown}, ${earthToneColors.deepMilkTea})`,
                        boxShadow: `0 8px 16px rgba(${isDarkMode ? '121, 85, 72' : '188, 170, 164'}, 0.3)`,
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: `0 12px 20px rgba(${isDarkMode ? '121, 85, 72' : '188, 170, 164'}, 0.4)`,
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
            <Box sx={{ my: 4, textAlign: 'center' }}>
                <Typography
                    component="h1"
                    variant="h4"
                    className="gradient-text"
                    sx={{
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        mb: 1
                    }}
                >
                    <AutoFixHighIcon sx={{ mr: 1.5, fontSize: '2rem' }} />
                    学习计划管理
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    自定义你的学习目标和偏好
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress sx={{ color: earthToneColors.deepMilkTea }} />
                </Box>
            ) : (
                <>
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <Tabs
                            value={selectedTabIndex}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTabs-indicator': {
                                    backgroundColor: earthToneColors.caramelBrown,
                                },
                                '& .MuiTab-root.Mui-selected': {
                                    color: earthToneColors.caramelBrown,
                                },
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            {plans.map((plan, index) => (
                                <Tab 
                                    key={plan._id || index} 
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {plan.isActive && <CheckCircleOutlineIcon sx={{ mr: 1, color: earthToneColors.caramelBrown }} />}
                                            {getWordbookNameById(plan.targetWordbook)}
                                        </Box>
                                    }
                                />
                            ))}
                            <Tab 
                                icon={<AddIcon />} 
                                iconPosition="start"
                                label="新建计划" 
                            />
                        </Tabs>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Fade in timeout={500}>
                                <Paper
                                    elevation={0}
                                    className="card-neumorphic"
                                    sx={{
                                        p: { xs: 2, sm: 3 },
                                        borderRadius: '16px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
                                    }}
                                >
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

                                    <Box sx={{ mt: 1, mb: 3 }}>
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: earthToneColors.caramelBrown,
                                            }}
                                        >
                                            <FlagIcon sx={{ mr: 1.5 }} />
                                            学习目标设置
                                        </Typography>
                                    </Box>
                                    
                                    <form onSubmit={handleSubmit}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={12}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: earthToneColors.milkCoffee
                                                    }}
                                                >
                                                    <MenuBookIcon sx={{ mr: 0.8, fontSize: '1.2rem' }} />
                                                    选择单词书
                                                </Typography>
                                                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                                                    <Select
                                                        value={formData.targetWordbookId}
                                                        onChange={(e) => handleFormChange({
                                                            target: { name: 'targetWordbookId', value: e.target.value }
                                                        })}
                                                        displayEmpty
                                                        sx={{
                                                            '&.MuiOutlinedInput-root': {
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: earthToneColors.caramelBrown,
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <MenuItem value="" disabled>
                                                            请选择一个单词书
                                                        </MenuItem>
                                                        {userWordbooks.map((book) => (
                                                            <MenuItem key={book._id} value={book._id}>
                                                                {book.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {loadingStats && (
                                                        <FormHelperText>加载单词书统计信息...</FormHelperText>
                                                    )}
                                                    {wordbookStats && (
                                                        <FormHelperText>
                                                            该单词书共有 {wordbookStats.totalWords} 个单词，
                                                            已学习 {wordbookStats.learnedWords} 个，
                                                            剩余 {wordbookStats.remainingNewWords} 个需要学习
                                                        </FormHelperText>
                                                    )}
                                                </FormControl>
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: earthToneColors.milkCoffee
                                                    }}
                                                >
                                                    <LoopIcon sx={{ mr: 0.8, fontSize: '1.2rem' }} />
                                                    每日复习单词数
                                                </Typography>
                                                <Slider
                                                    aria-label="每日复习单词数"
                                                    valueLabelDisplay="auto"
                                                    step={5}
                                                    min={10}
                                                    max={100}
                                                    value={dailyReviewCount}
                                                    onChange={handleSliderChange(setDailyReviewCount)}
                                                    marks={[
                                                        { value: 10, label: '10' },
                                                        { value: 50, label: '50' },
                                                        { value: 100, label: '100' }
                                                    ]}
                                                    sx={{
                                                        color: earthToneColors.deepMilkTea,
                                                        '& .MuiSlider-thumb': {
                                                            width: 28,
                                                            height: 28,
                                                            backgroundColor: earthToneColors.deepMilkTea,
                                                            '&:hover, &.Mui-focusVisible': {
                                                                boxShadow: `0px 0px 0px 8px rgba(${isDarkMode ? '210, 180, 140' : '210, 180, 140'}, 0.16)`
                                                            }
                                                        },
                                                        '& .MuiSlider-valueLabel': {
                                                            backgroundColor: earthToneColors.deepMilkTea
                                                        }
                                                    }}
                                                />
                                                <TextField
                                                    type="number"
                                                    value={dailyReviewCount}
                                                    onChange={handleTextInputChange(setDailyReviewCount)}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">单词/天</InputAdornment>,
                                                    }}
                                                    variant="outlined"
                                                    sx={{
                                                        mt: 2,
                                                        width: '100%',
                                                        '& .MuiOutlinedInput-root': {
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: earthToneColors.deepMilkTea,
                                                            },
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: earthToneColors.milkCoffee
                                                    }}
                                                >
                                                    <AddIcon sx={{ mr: 0.8, fontSize: '1.2rem' }} />
                                                    每日学习新单词数
                                                </Typography>
                                                <Slider
                                                    aria-label="每日学习新单词数"
                                                    valueLabelDisplay="auto"
                                                    step={1}
                                                    min={1}
                                                    max={30}
                                                    value={dailyNewWordsCount}
                                                    onChange={handleSliderChange(setDailyNewWordsCount)}
                                                    marks={[
                                                        { value: 1, label: '1' },
                                                        { value: 15, label: '15' },
                                                        { value: 30, label: '30' }
                                                    ]}
                                                    sx={{
                                                        color: earthToneColors.caramelBrown,
                                                        '& .MuiSlider-thumb': {
                                                            width: 28,
                                                            height: 28,
                                                            backgroundColor: earthToneColors.caramelBrown,
                                                            '&:hover, &.Mui-focusVisible': {
                                                                boxShadow: `0px 0px 0px 8px rgba(${isDarkMode ? '166, 124, 82' : '166, 124, 82'}, 0.16)`
                                                            }
                                                        },
                                                        '& .MuiSlider-valueLabel': {
                                                            backgroundColor: earthToneColors.caramelBrown
                                                        }
                                                    }}
                                                />
                                                <TextField
                                                    type="number"
                                                    value={dailyNewWordsCount}
                                                    onChange={handleTextInputChange(setDailyNewWordsCount)}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end">单词/天</InputAdornment>,
                                                    }}
                                                    variant="outlined"
                                                    sx={{
                                                        mt: 2,
                                                        width: '100%',
                                                        '& .MuiOutlinedInput-root': {
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: earthToneColors.caramelBrown,
                                                            },
                                                        },
                                                    }}
                                                />
                                                {suggestion.newWords && (
                                                    <FormHelperText sx={{ color: earthToneColors.caramelBrown }}>
                                                        {suggestion.newWords}
                                                    </FormHelperText>
                                                )}
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: earthToneColors.milkCoffee
                                                    }}
                                                >
                                                    <CalendarTodayIcon sx={{ mr: 0.8, fontSize: '1.2rem' }} />
                                                    计划结束日期
                                                </Typography>
                                                <TextField
                                                    type="date"
                                                    name="planEndDate"
                                                    value={formData.planEndDate}
                                                    onChange={(e) => handleFormChange(e)}
                                                    InputLabelProps={{ shrink: true }}
                                                    fullWidth
                                                    variant="outlined"
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: earthToneColors.caramelBrown,
                                                            },
                                                        },
                                                    }}
                                                />
                                                {suggestion.endDate && (
                                                    <FormHelperText 
                                                        sx={{ 
                                                            color: suggestion.endDate.includes('无效') || suggestion.endDate.includes('今天')
                                                                ? 'error.main'
                                                                : earthToneColors.caramelBrown
                                                        }}
                                                    >
                                                        {suggestion.endDate}
                                                    </FormHelperText>
                                                )}
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ my: 3 }} />

                                        <Box sx={{ mt: 2, mb: 3 }}>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: earthToneColors.caramelBrown
                                                }}
                                            >
                                                <SettingsIcon sx={{ mr: 1.5 }} />
                                                学习偏好设置
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <FormControl component="fieldset">
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 'medium',
                                                            mb: 1.5,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            color: earthToneColors.milkCoffee
                                                        }}
                                                    >
                                                        <FormatListBulletedIcon sx={{ mr: 0.8, fontSize: '1.2rem' }} />
                                                        复习模式优先级
                                                    </Typography>
                                                    <FormGroup>
                                                        {reviewModes.map((mode, index) => (
                                                            <FormControlLabel
                                                                key={mode.id}
                                                                control={
                                                                    <Checkbox
                                                                        checked={mode.enabled}
                                                                        onChange={() => handleToggleReviewMode(index)}
                                                                        sx={{
                                                                            color: earthToneColors.deepMilkTea,
                                                                            '&.Mui-checked': {
                                                                                color: earthToneColors.deepMilkTea,
                                                                            },
                                                                        }}
                                                                    />
                                                                }
                                                                label={mode.name}
                                                            />
                                                        ))}
                                                    </FormGroup>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{
                                                        fontWeight: 'medium',
                                                        mb: 1.5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: earthToneColors.milkCoffee
                                                    }}
                                                >
                                                    <AccessTimeIcon sx={{ mr: 0.8, fontSize: '1.2rem' }} />
                                                    每日学习提醒
                                                </Typography>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={reminderEnabled}
                                                            onChange={(e) => setReminderEnabled(e.target.checked)}
                                                            sx={{
                                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                                    color: earthToneColors.caramelBrown,
                                                                    '&:hover': {
                                                                        backgroundColor: `rgba(166, 124, 82, 0.08)`,
                                                                    },
                                                                },
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: earthToneColors.caramelBrown,
                                                                },
                                                            }}
                                                        />
                                                    }
                                                    label="启用学习提醒"
                                                />
                                                <TextField
                                                    label="提醒时间"
                                                    type="time"
                                                    value={reminderTime}
                                                    onChange={(e) => setReminderTime(e.target.value)}
                                                    disabled={!reminderEnabled}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    inputProps={{
                                                        step: 300, // 5 min
                                                    }}
                                                    sx={{
                                                        mt: 2,
                                                        width: '100%',
                                                        '& .MuiOutlinedInput-root': {
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: earthToneColors.caramelBrown,
                                                            },
                                                        },
                                                        '& .MuiInputLabel-root.Mui-focused': {
                                                            color: earthToneColors.caramelBrown,
                                                        },
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ my: 3 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                            {selectedTabIndex < plans.length && plans[selectedTabIndex] && !plans[selectedTabIndex].isActive && (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<CheckCircleOutlineIcon />}
                                                    onClick={() => handleActivatePlan(plans[selectedTabIndex]._id)}
                                                    disabled={isSaving}
                                                    sx={{
                                                        px: 3,
                                                        py: 1,
                                                        borderRadius: '12px',
                                                        borderColor: earthToneColors.caramelBrown,
                                                        color: earthToneColors.caramelBrown,
                                                        '&:hover': {
                                                            borderColor: earthToneColors.deepMilkTea,
                                                            backgroundColor: `rgba(166, 124, 82, 0.04)`,
                                                        }
                                                    }}
                                                >
                                                    激活此计划
                                                </Button>
                                            )}
                                            
                                            {selectedTabIndex < plans.length && plans[selectedTabIndex] && plans[selectedTabIndex].isActive && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<DeleteOutlineIcon />}
                                                    onClick={handleDeactivatePlan}
                                                    disabled={isSaving}
                                                    sx={{
                                                        px: 3,
                                                        py: 1,
                                                        borderRadius: '12px'
                                                    }}
                                                >
                                                    停用计划
                                                </Button>
                                            )}

                                            <Box>
                                                {selectedTabIndex < plans.length && !isCreatingNew && (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<DeleteOutlineIcon />}
                                                        onClick={() => handleDeletePlan(plans[selectedTabIndex]._id)}
                                                        disabled={isSaving}
                                                        sx={{ 
                                                            px: 3,
                                                            py: 1,
                                                            mr: 2,
                                                            borderRadius: '12px'
                                                        }}
                                                    >
                                                        删除
                                                    </Button>
                                                )}
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    startIcon={<SaveIcon />}
                                                    disabled={isSaving || !formData.targetWordbookId}
                                                    sx={{
                                                        px: 4,
                                                        py: 1.2,
                                                        borderRadius: '12px',
                                                        background: `linear-gradient(90deg, ${earthToneColors.caramelBrown}, ${earthToneColors.milkCoffee})`,
                                                        boxShadow: '0px 4px 12px rgba(166, 124, 82, 0.25)',
                                                        '&:hover': {
                                                            background: `linear-gradient(90deg, ${earthToneColors.caramelBrown}, ${earthToneColors.deepMilkTea})`,
                                                            boxShadow: '0px 6px 16px rgba(166, 124, 82, 0.35)',
                                                        },
                                                    }}
                                                >
                                                    {isSaving ? '保存中...' : isCreatingNew ? '创建计划' : '保存设置'}
                                                </Button>
                                            </Box>
                                        </Box>
                                    </form>
                                </Paper>
                            </Fade>
                        </Grid>
                    </Grid>
                </>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleSnackbarClose} 
                    severity={snackbarSeverity} 
                    sx={{ 
                        width: '100%', 
                        borderRadius: '12px',
                        backgroundColor: snackbarSeverity === 'success' 
                            ? `${earthToneColors.deepMilkTea}`
                            : undefined
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default PlanSettingsPage;