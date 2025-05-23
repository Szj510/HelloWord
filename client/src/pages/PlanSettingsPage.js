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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
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

// 记忆曲线设置组件
const MemoryCurveSettings = ({ open, onClose, initialValues, onSave }) => {
    const [settings, setSettings] = useState({
        efFactor: 2.5,
        intervalModifier: 1.0,
        ...initialValues
    });

    const handleChange = (name) => (event, newValue) => {
        setSettings({
            ...settings,
            [name]: newValue
        });
    };

    const handleInputChange = (name) => (event) => {
        const value = parseFloat(event.target.value);
        if (!isNaN(value)) {
            setSettings({
                ...settings,
                [name]: value
            });
        }
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <PsychologyIcon color="primary" />
                记忆曲线高级设置
            </DialogTitle>
            <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    color: (theme) => theme.palette.grey[500],
                }}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" paragraph>
                    这些设置会影响记忆算法如何安排你的复习计划，仅供高级用户使用。
                </Typography>

                <Box sx={{ my: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>难度因子 (EF): {settings.efFactor.toFixed(2)}</span>
                        <Tooltip title="此因子影响单词的复习间隔增长率。值越小，复习频率越高。" arrow>
                            <InfoIcon fontSize="small" color="action" sx={{ ml: 1, fontSize: '1rem', opacity: 0.8 }} />
                        </Tooltip>
                    </Typography>
                    <Slider
                        value={settings.efFactor}
                        onChange={handleChange('efFactor')}
                        min={1.3}
                        max={3.0}
                        step={0.1}
                        marks={[
                            { value: 1.3, label: '1.3' },
                            { value: 2.5, label: '2.5 (默认)' },
                            { value: 3.0, label: '3.0' }
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <TextField
                        margin="dense"
                        label="难度因子值"
                        type="number"
                        fullWidth
                        value={settings.efFactor}
                        onChange={handleInputChange('efFactor')}
                        inputProps={{
                            step: 0.1,
                            min: 1.3,
                            max: 3.0
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                    />
                    <FormHelperText>
                        难度因子控制间隔增长率。值越低，复习越频繁；值越高，复习间隔增长越快。标准值为2.5。
                    </FormHelperText>
                </Box>

                <Box sx={{ my: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>间隔修正系数: {settings.intervalModifier.toFixed(2)}</span>
                        <Tooltip title="此系数直接影响所有复习间隔。值越大，复习间隔越长。" arrow>
                            <InfoIcon fontSize="small" color="action" sx={{ ml: 1, fontSize: '1rem', opacity: 0.8 }} />
                        </Tooltip>
                    </Typography>
                    <Slider
                        value={settings.intervalModifier}
                        onChange={handleChange('intervalModifier')}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        marks={[
                            { value: 0.5, label: '0.5' },
                            { value: 1.0, label: '1.0 (默认)' },
                            { value: 2.0, label: '2.0' }
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <TextField
                        margin="dense"
                        label="间隔修正系数"
                        type="number"
                        fullWidth
                        value={settings.intervalModifier}
                        onChange={handleInputChange('intervalModifier')}
                        inputProps={{
                            step: 0.1,
                            min: 0.5,
                            max: 2.0
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                    />
                    <FormHelperText>
                        间隔修正系数直接与计算出的复习间隔相乘。值越大，记忆要求越严格，复习间隔越长。
                    </FormHelperText>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} variant="outlined">取消</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(90deg, #8E54E9, #4776E6)',
                        boxShadow: '0 4px 10px rgba(71, 118, 230, 0.25)'
                    }}
                >
                    保存设置
                </Button>
            </DialogActions>
        </Dialog>
    );
};

function PlanSettingsPage() {
    const [plans, setPlans] = useState([]);
    const [activePlan, setActivePlan] = useState(null);
    const [userWordbooks, setUserWordbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [formData, setFormData] = useState({
        name: '', // 新增
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

    const [memoryCurveDialogOpen, setMemoryCurveDialogOpen] = useState(false);
    const [memoryCurveSettings, setMemoryCurveSettings] = useState({
        efFactor: 2.5,
        intervalModifier: 1.0
    });

    const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(false);

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
                name: currentActivePlan?.name || '', // 新增
                targetWordbookId: currentActivePlan?.targetWordbook || defaultWordbookId,
                dailyNewWordsTarget: currentActivePlan?.dailyNewWordsTarget || 15,
                dailyReviewWordsTarget: currentActivePlan?.dailyReviewWordsTarget || 40,
                planEndDate: currentActivePlan?.planEndDate ? dayjs(currentActivePlan.planEndDate).format('YYYY-MM-DD') : ''
            };

            setFormData(initialFormState);
            setDailyNewWordsCount(initialFormState.dailyNewWordsTarget);
            setDailyReviewCount(initialFormState.dailyReviewWordsTarget);
            setIsEditing(!!currentActivePlan);

            // 同步邮件提醒、时间、周报开关
            if (currentActivePlan) {
                setReminderEnabled(!!currentActivePlan.reminderEnabled);
                setReminderTime(currentActivePlan.reminderTime || '08:00');
                setWeeklyReportEnabled(!!currentActivePlan.weeklyReportEnabled);
            } else {
                setReminderEnabled(false);
                setReminderTime('08:00');
                setWeeklyReportEnabled(false);
            }

            if (initialFormState.targetWordbookId) {
                fetchWordbookStats(initialFormState.targetWordbookId);
            }

            // 获取记忆曲线设置
            try {
                const memoryCurveData = await apiFetch('/api/plans/memory-curve');
                if (memoryCurveData) {
                    setMemoryCurveSettings({
                        efFactor: memoryCurveData.efFactor || 2.5,
                        intervalModifier: memoryCurveData.intervalModifier || 1.0
                    });
                }
            } catch (err) {
                console.warn("获取记忆曲线设置失败，使用默认值", err);
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
                // 确保日期格式正确
                const endDateObj = dayjs().add(daysNeeded - 1, 'day');
                suggestedEndDate = endDateObj.format('YYYY-MM-DD');
                console.log("计算的结束日期:", suggestedEndDate);

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
        console.log("创建新计划");
        const defaultWordbookId = (userWordbooks.length > 0) ? userWordbooks[0]._id : '';
        setFormData({
            name: '', // 新增
            targetWordbookId: defaultWordbookId,
            dailyNewWordsTarget: 15,
            dailyReviewWordsTarget: 40,
            planEndDate: ''
        });
        setDailyNewWordsCount(15);
        setDailyReviewCount(40);

        // 设置提醒和每周报告
        setReminderEnabled(true);
        setReminderTime('08:00');

        // 明确设置每周报告为false
        console.log("设置每周报告为false");
        setWeeklyReportEnabled(false);

        // 重置复习模式为默认值
        setReviewModes([
            { id: 1, name: '模式一', enabled: true },
            { id: 2, name: '模式二', enabled: false },
            { id: 3, name: '模式三', enabled: true }
        ]);
        setIsCreatingNew(true);
        setSelectedTabIndex(plans.length); // 切换到新计划的tab
        if (defaultWordbookId) {
            fetchWordbookStats(defaultWordbookId);
        }
    };

    const handleSelectPlan = (planIndex) => {
        if (planIndex >= 0 && planIndex < plans.length) {
            const selectedPlan = plans[planIndex];
            console.log("选择计划:", selectedPlan);

            // 处理日期格式
            let formattedEndDate = '';
            if (selectedPlan.planEndDate) {
                try {
                    formattedEndDate = dayjs(selectedPlan.planEndDate).format('YYYY-MM-DD');
                    console.log("格式化后的结束日期:", formattedEndDate);
                } catch (err) {
                    console.error("日期格式化错误:", err);
                }
            }

            setFormData({
                name: selectedPlan.name || '', // 新增
                targetWordbookId: selectedPlan.targetWordbook || '',
                dailyNewWordsTarget: selectedPlan.dailyNewWordsTarget || 15,
                dailyReviewWordsTarget: selectedPlan.dailyReviewWordsTarget || 40,
                planEndDate: formattedEndDate
            });
            setDailyNewWordsCount(selectedPlan.dailyNewWordsTarget || 15);
            setDailyReviewCount(selectedPlan.dailyReviewWordsTarget || 40);
            setReminderEnabled(!!selectedPlan.reminderEnabled);
            setReminderTime(selectedPlan.reminderTime || '08:00');

            // 明确设置每周报告状态
            const reportEnabled = selectedPlan.weeklyReportEnabled === true;
            console.log("每周报告状态:", reportEnabled, "原始值:", selectedPlan.weeklyReportEnabled);
            setWeeklyReportEnabled(reportEnabled);

            // 设置复习模式
            if (selectedPlan.reviewModes && Array.isArray(selectedPlan.reviewModes)) {
                setReviewModes(selectedPlan.reviewModes);
            } else {
                // 如果没有复习模式设置，使用默认值
                setReviewModes([
                    { id: 1, name: '模式一', enabled: true },
                    { id: 2, name: '模式二', enabled: false },
                    { id: 3, name: '模式三', enabled: true }
                ]);
            }

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
        if (!formData.name || formData.name.trim() === '') {
            showSnackbar("请输入计划名称", "warning");
            return;
        }
        setIsSaving(true); setError('');
        try {
            const isCreate = isCreatingNew;
            const payload = {
                ...formData,
                dailyNewWordsTarget: dailyNewWordsCount,
                dailyReviewWordsTarget: dailyReviewCount,
                reminderEnabled: reminderEnabled,
                reminderTime: reminderTime,
                weeklyReportEnabled: weeklyReportEnabled,
                reviewModes: reviewModes
            };
            if (selectedTabIndex < plans.length && !isCreatingNew) {
                payload.planId = plans[selectedTabIndex]._id;
            }
            if (!payload.planEndDate) {
                delete payload.planEndDate;
            }

            const response = await apiFetch('/api/plans', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            await fetchData(); // 重新加载所有计划

            // 用后端返回的计划数据刷新所有表单和状态
            let newPlan = null;
            if (response && response.plan) {
                newPlan = response.plan;
            } else if (isCreate && Array.isArray(plans) && plans.length > 0) {
                newPlan = plans[plans.length];
            } else if (plans[selectedTabIndex]) {
                newPlan = plans[selectedTabIndex];
            }
            if (newPlan) {
                console.log("更新后的计划数据:", newPlan);

                // 处理日期格式
                let formattedEndDate = '';
                if (newPlan.planEndDate) {
                    try {
                        formattedEndDate = dayjs(newPlan.planEndDate).format('YYYY-MM-DD');
                        console.log("格式化后的结束日期:", formattedEndDate);
                    } catch (err) {
                        console.error("日期格式化错误:", err);
                    }
                }

                setFormData({
                    name: newPlan.name || '', // 新增
                    targetWordbookId: newPlan.targetWordbook || '',
                    dailyNewWordsTarget: newPlan.dailyNewWordsTarget || 15,
                    dailyReviewWordsTarget: newPlan.dailyReviewWordsTarget || 40,
                    planEndDate: formattedEndDate
                });
                setDailyNewWordsCount(newPlan.dailyNewWordsTarget || 15);
                setDailyReviewCount(newPlan.dailyReviewWordsTarget || 40);
                setReminderEnabled(!!newPlan.reminderEnabled);
                setReminderTime(newPlan.reminderTime || '08:00');

                // 明确设置每周报告状态
                const reportEnabled = newPlan.weeklyReportEnabled === true;
                console.log("每周报告状态:", reportEnabled, "原始值:", newPlan.weeklyReportEnabled);
                setWeeklyReportEnabled(reportEnabled);

                // 设置复习模式
                if (newPlan.reviewModes && Array.isArray(newPlan.reviewModes)) {
                    setReviewModes(newPlan.reviewModes);
                }
            }
            if (isCreate) {
                setSelectedTabIndex(plans.length);
                setIsCreatingNew(false);
            }
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

    const saveMemoryCurveSettings = async (settings) => {
        try {
            await apiFetch('/api/plans/memory-curve', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            setMemoryCurveSettings(settings);
            showSnackbar('记忆曲线设置已更新', 'success');
        } catch (err) {
            console.error("保存记忆曲线设置失败:", err);
            showSnackbar(`保存记忆曲线设置失败: ${err.message}`, 'error');
        }
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
        <Container maxWidth="lg" className="animate-fade-in">
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
                                                    计划名称
                                                </Typography>
                                                <TextField
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleFormChange}
                                                    placeholder="请输入计划名称"
                                                    fullWidth
                                                    variant="outlined"
                                                    sx={{
                                                        mb: 2,
                                                        '& .MuiOutlinedInput-root': {
                                                            '&.Mui-focused fieldset': {
                                                                borderColor: earthToneColors.caramelBrown,
                                                            },
                                                        },
                                                    }}
                                                />
                                            </Grid>

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
                                                    value={formData.planEndDate || ''}
                                                    onChange={(e) => {
                                                        console.log("日期输入变更:", e.target.value);
                                                        handleFormChange(e);
                                                    }}
                                                    InputLabelProps={{ shrink: true }}
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="YYYY-MM-DD"
                                                    inputProps={{
                                                        min: dayjs().format('YYYY-MM-DD') // 设置最小日期为今天
                                                    }}
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
                                                    邮件通知设置
                                                </Typography>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={weeklyReportEnabled}
                                                            onChange={(e) => {
                                                                const newValue = e.target.checked;
                                                                console.log("每周报告开关切换:", newValue);
                                                                setWeeklyReportEnabled(newValue);
                                                            }}
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
                                                    label="接收每周学习报告"
                                                />
                                                <FormHelperText>
                                                    每周将收到一份学习进度报告及统计数据
                                                </FormHelperText>
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

                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                className="card-glass"
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    height: '100%'
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 2,
                                        fontWeight: 'medium',
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <SettingsIcon sx={{ mr: 1.5 }} />
                                    高级学习设置
                                </Typography>

                                <List disablePadding>
                                    <ListItem
                                        sx={{
                                            px: 0,
                                            borderBottom: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() => setMemoryCurveDialogOpen(true)}
                                            sx={{
                                                borderRadius: '8px',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <PsychologyIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="记忆曲线参数设置"
                                                secondary="自定义记忆算法的参数"
                                            />
                                            <ChevronRightIcon color="action" />
                                        </ListItemButton>
                                    </ListItem>

                                    <ListItem
                                        sx={{
                                            px: 0
                                        }}
                                    >
                                        <ListItemButton
                                            sx={{
                                                borderRadius: '8px',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                }
                                            }}
                                        >
                                            <ListItemIcon>
                                                <CloudDownloadIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="导出学习数据"
                                                secondary="将你的学习记录导出为文件"
                                            />
                                            <ChevronRightIcon color="action" />
                                        </ListItemButton>
                                    </ListItem>
                                </List>

                                <Box sx={{ mt: 3 }}>
                                    <Alert
                                        severity="info"
                                        variant="outlined"
                                        sx={{
                                            borderRadius: '8px'
                                        }}
                                    >
                                        高级设置可能影响学习效果，建议有经验的用户使用。
                                    </Alert>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    <MemoryCurveSettings
                        open={memoryCurveDialogOpen}
                        onClose={() => setMemoryCurveDialogOpen(false)}
                        initialValues={memoryCurveSettings}
                        onSave={saveMemoryCurveSettings}
                    />
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