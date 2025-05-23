import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

// MUI组件
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

// 图标
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoodIcon from '@mui/icons-material/Mood';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

function WordbooksPage() {
    const [wordbooks, setWordbooks] = useState([]);
    const [openNewDialog, setOpenNewDialog] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [newWordbookName, setNewWordbookName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedWordbook, setSelectedWordbook] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editWordbookName, setEditWordbookName] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    
    // 添加导入预设单词书相关状态
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [presetWordbooks, setPresetWordbooks] = useState([]);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [loadingPresets, setLoadingPresets] = useState(false);
    
    // 获取当前主题和配色方案
    const { colorScheme } = useTheme();
    
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

    const navigate = useNavigate();

    // 获取单词书
    useEffect(() => {
        const fetchWordbooks = async () => {
            setLoading(true);
            try {
                const data = await apiFetch('/api/wordbooks');
                setWordbooks(data || []);
            } catch (err) {
                setError(`获取单词书失败: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchWordbooks();
    }, []);
    
    // 获取预设单词书列表
    const fetchPresetWordbooks = async () => {
        setLoadingPresets(true);
        try {
            const data = await apiFetch('/api/wordbooks/presets');
            setPresetWordbooks(data || []);
            if (data && data.length > 0) {
                setSelectedPreset(data[0].id);  // 默认选择第一个预设
            }
        } catch (err) {
            showSnackbar(`获取预设单词书失败: ${err.message}`, 'error');
        } finally {
            setLoadingPresets(false);
        }
    };
    
    // 打开导入预设单词书对话框
    const handleOpenImportDialog = () => {
        fetchPresetWordbooks();
        setImportDialogOpen(true);
    };
    
    // 关闭导入对话框
    const handleCloseImportDialog = () => {
        setImportDialogOpen(false);
    };
    
    // 导入预设单词书
    const handleImportPreset = async () => {
        if (!selectedPreset) {
            showSnackbar('请选择要导入的单词书', 'error');
            return;
        }
        
        setDialogLoading(true);
        try {
            const data = await apiFetch('/api/wordbooks/import', {
                method: 'POST',
                body: JSON.stringify({ presetId: selectedPreset }),
            });
            
            // 添加到现有列表
            setWordbooks([...wordbooks, data]);
            setImportDialogOpen(false);
            showSnackbar('单词书导入成功！', 'success');
        } catch (err) {
            showSnackbar(`导入单词书失败: ${err.message}`, 'error');
        } finally {
            setDialogLoading(false);
        }
    };

    // 处理新建单词书对话框
    const handleOpenNewDialog = () => {
        setNewWordbookName('');
        setOpenNewDialog(true);
    };

    const handleCloseNewDialog = () => {
        setOpenNewDialog(false);
    };

    // 创建新单词书
    const handleCreateWordbook = async () => {
        if (!newWordbookName.trim()) {
            showSnackbar('单词书名称不能为空', 'error');
            return;
        }

        setDialogLoading(true);
        try {
            const data = await apiFetch('/api/wordbooks', {
                method: 'POST',
                body: JSON.stringify({ name: newWordbookName }),
            });

            // 添加到现有列表
            setWordbooks([...wordbooks, data]);
            setOpenNewDialog(false);
            showSnackbar('单词书创建成功！', 'success');
        } catch (err) {
            showSnackbar(`创建单词书失败: ${err.message}`, 'error');
        } finally {
            setDialogLoading(false);
        }
    };

    // 开始学习
    const handleStartLearning = (wordbookId) => {
        // 明确指定模式为"new"，只学习新单词
        navigate(`/learn/${wordbookId}`, {
            state: {
                mode: 'new'  // 明确指定只学习新单词
            }
        });
    };

    // 新增：开始复习功能
    const handleStartReview = (wordbookId) => {
        // 明确指定模式为"review"，只复习旧单词
        navigate(`/learn/${wordbookId}`, {
            state: {
                mode: 'review'  // 明确指定只复习旧单词
            }
        });
    };

    // 查看单词书详情
    const handleViewDetail = (wordbookId) => {
        navigate(`/wordbooks/${wordbookId}`);
    };

    // 菜单相关
    const handleOpenMenu = (event, wordbook) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedWordbook(wordbook);
    };

    const handleCloseMenu = () => {
        setMenuAnchorEl(null);
        setSelectedWordbook(null);
    };

    // 编辑单词书
    const handleOpenEditDialog = () => {
        if (selectedWordbook) {
            setEditWordbookName(selectedWordbook.name);
            setEditDialogOpen(true);
            handleCloseMenu();
        }
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
    };

    const handleUpdateWordbook = async () => {
        if (!editWordbookName.trim()) {
            showSnackbar('单词书名称不能为空', 'error');
            return;
        }

        setDialogLoading(true);
        try {
            await apiFetch(`/api/wordbooks/${selectedWordbook._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: editWordbookName }),
            });

            // 更新列表
            setWordbooks(wordbooks.map(wb => 
                wb._id === selectedWordbook._id ? { ...wb, name: editWordbookName } : wb
            ));
            setEditDialogOpen(false);
            showSnackbar('单词书更新成功！', 'success');
        } catch (err) {
            showSnackbar(`更新单词书失败: ${err.message}`, 'error');
        } finally {
            setDialogLoading(false);
        }
    };

    // 删除单词书
    const handleDeleteWordbook = async () => {
        if (!window.confirm(`确定要删除单词书 "${selectedWordbook.name}" 吗？`)) {
            handleCloseMenu();
            return;
        }

        try {
            await apiFetch(`/api/wordbooks/${selectedWordbook._id}`, {
                method: 'DELETE',
            });
            
            // 从列表中移除
            setWordbooks(wordbooks.filter(wb => wb._id !== selectedWordbook._id));
            showSnackbar('单词书删除成功！', 'success');
        } catch (err) {
            showSnackbar(`删除单词书失败: ${err.message}`, 'error');
        } finally {
            handleCloseMenu();
        }
    };

    // 显示Snackbar通知
    const showSnackbar = (message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    return (
        <Container maxWidth="lg" className="animate-fade-in">
            <Box sx={{ 
                mt: 4, 
                mb: 6, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography 
                    component="h1" 
                    variant="h4"
                    className="gradient-text" 
                    sx={{ 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <BookIcon sx={{ mr: 2, fontSize: '2rem', color: themeColors.accent || '#A67C52' }} />
                    我的单词书
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleOpenImportDialog}
                        sx={{
                            borderRadius: '50px',
                            py: 1.3,
                            px: 3,
                            borderColor: themeColors.accent || '#A67C52',
                            color: themeColors.accent || '#A67C52',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: themeColors.secondary || '#C4A484',
                                backgroundColor: themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)',
                                transform: 'translateY(-3px)'
                            },
                        }}
                        className="hover-lift"
                    >
                        导入预设单词书
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenNewDialog}
                        sx={{
                            borderRadius: '50px',
                            py: 1.3,
                            px: 3,
                            background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                            boxShadow: `0 8px 16px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: `0 12px 20px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.4)'}`,
                                transform: 'translateY(-3px)'
                            },
                        }}
                        className="hover-lift"
                    >
                        新建单词书
                    </Button>
                </Box>
            </Box>

            {/* 加载状态 */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
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

            {/* 没有单词书时显示 */}
            {!loading && !error && wordbooks.length === 0 && (
                <Fade in={true} timeout={1000}>
                    <Box 
                        className="card-glass" 
                        sx={{ 
                            p: 5, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            borderRadius: '20px',
                            my: 4,
                            textAlign: 'center',
                            backgroundColor: themeColors.light || '#F8F4E9'
                        }}
                    >
                        <MoodIcon sx={{ fontSize: '4rem', color: themeColors.accent || '#A67C52', mb: 2 }} />
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: themeColors.text || '#3E2723' }}>
                            你还没有创建任何单词书
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, color: themeColors.secondary || '#C4A484' }}>
                            点击"新建单词书"按钮开始创建自己的单词书，然后从单词列表中添加单词！
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenNewDialog}
                            sx={{
                                borderRadius: '50px',
                                py: 1.5,
                                px: 4,
                                background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                                boxShadow: `0 8px 16px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `0 12px 20px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.4)'}`,
                                    transform: 'translateY(-3px)'
                                },
                            }}
                        >
                            新建单词书
                        </Button>
                    </Box>
                </Fade>
            )}

            {/* 单词书列表 */}
            {!loading && !error && wordbooks.length > 0 && (
                <Grid container spacing={3}>
                    {wordbooks.map((wordbook, index) => (
                        <Grid item xs={12} sm={6} md={4} key={wordbook._id}>
                            <Grow 
                                in={true} 
                                timeout={(index + 1) * 300}
                                style={{ transformOrigin: '0 0 0' }}
                            >
                                <Card
                                    elevation={0}
                                    className="card-neumorphic hover-lift"
                                    sx={{
                                        position: 'relative',
                                        overflow: 'visible',
                                        borderRadius: '16px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s ease',
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
                                            background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                                            borderTopLeftRadius: '16px',
                                            borderTopRightRadius: '16px',
                                            opacity: 0.7
                                        }}
                                    />

                                    <CardHeader
                                        title={
                                            <Typography 
                                                variant="h6" 
                                                sx={{ 
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: themeColors.text || '#3E2723'
                                                }}
                                            >
                                                <DashboardCustomizeIcon sx={{ mr: 1, color: themeColors.accent || '#A67C52' }} />
                                                {wordbook.name}
                                            </Typography>
                                        }
                                        action={
                                            <IconButton 
                                                aria-label="settings" 
                                                onClick={(e) => handleOpenMenu(e, wordbook)}
                                                sx={{
                                                    color: themeColors.accent || '#A67C52',
                                                }}
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        }
                                        sx={{ pt: 3 }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: themeColors.text || '#3E2723' }}>
                                                总单词数: <strong>{wordbook.totalWords || 0}</strong>
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: themeColors.text || '#3E2723' }}>
                                                已学习: <strong>{wordbook.learnedCount || 0}</strong>
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ color: themeColors.text || '#3E2723' }}>
                                                已掌握: <strong>{wordbook.masteredCount || 0}</strong>
                                            </Typography>
                                        </Box>
                                        
                                        <Box 
                                            sx={{ 
                                                mt: 2, 
                                                pt: 2, 
                                                borderTop: `1px solid ${themeColors.borderColor || 'rgba(166, 124, 82, 0.2)'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    color: themeColors.secondary || '#C4A484'
                                                }}
                                            >
                                                <SchoolIcon 
                                                    fontSize="small" 
                                                    sx={{ 
                                                        mr: 0.5, 
                                                        color: wordbook.wordCount ? themeColors.accent || '#A67C52' : themeColors.tertiary || '#D2B48C' 
                                                    }} 
                                                />
                                                学习进度:
                                            </Typography>
                                            <Box 
                                                sx={{ 
                                                    position: 'relative', 
                                                    width: '60%', 
                                                    height: '8px', 
                                                    backgroundColor: themeColors.borderColor || 'rgba(166, 124, 82, 0.1)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Box 
                                                    sx={{ 
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        height: '100%',
                                                        width: `${wordbook.totalWords ? (wordbook.masteredCount / wordbook.totalWords) * 100 : 0}%`,
                                                        background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                                                        borderRadius: '4px',
                                                        transition: 'width 1s ease-in-out'
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                    
                                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                                        <Button 
                                            size="small"
                                            onClick={() => handleViewDetail(wordbook._id)}
                                            sx={{
                                                color: themeColors.accent || '#A67C52',
                                                '&:hover': {
                                                    backgroundColor: `${themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)'}`
                                                }
                                            }}
                                        >
                                            查看详情
                                        </Button>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="学习新词">
                                                <span>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<PlayArrowIcon />}
                                                        onClick={() => handleStartLearning(wordbook._id)}
                                                        disabled={wordbook.totalWords === 0}
                                                        sx={{
                                                            borderRadius: '20px',
                                                            background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                                                            boxShadow: `0 4px 12px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.2)'}`,
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                boxShadow: `0 6px 15px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                                                                transform: 'translateY(-2px)'
                                                            },
                                                            '&:active': {
                                                                transform: 'translateY(0)'
                                                            }
                                                        }}
                                                    >
                                                        学习
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="复习单词">
                                                <span>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<SchoolIcon />}
                                                        onClick={() => handleStartReview(wordbook._id)}
                                                        disabled={wordbook.learnedCount === 0}
                                                        sx={{
                                                            borderRadius: '20px',
                                                            borderColor: themeColors.accent || '#A67C52',
                                                            color: themeColors.accent || '#A67C52',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                borderColor: themeColors.secondary || '#C4A484',
                                                                backgroundColor: `${themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)'}`,
                                                                transform: 'translateY(-2px)'
                                                            },
                                                            '&:active': {
                                                                transform: 'translateY(0)'
                                                            }
                                                        }}
                                                    >
                                                        复习
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    </CardActions>
                                </Card>
                            </Grow>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 新建单词书对话框 */}
            <Dialog
                open={openNewDialog}
                onClose={handleCloseNewDialog}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        backgroundColor: themeColors.primary || '#F3E9DD'
                    },
                    elevation: 2
                }}
            >
                <DialogTitle 
                    sx={{ 
                        background: `linear-gradient(135deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                        color: themeColors.light || '#F8F4E9',
                        py: 2,
                    }}
                >
                    新建单词书
                </DialogTitle>
                <DialogContent sx={{ mt: 2, minWidth: '400px' }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="单词书名称"
                        type="text"
                        fullWidth
                        value={newWordbookName}
                        onChange={(e) => setNewWordbookName(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${themeColors.borderColor || 'rgba(166, 124, 82, 0.3)'}`
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${themeColors.borderColorHover || 'rgba(166, 124, 82, 0.5)'}`
                            },
                            '& .MuiInputLabel-root': {
                                color: themeColors.accent || '#A67C52'
                            },
                            '& .MuiOutlinedInput-input': {
                                color: themeColors.text || '#3E2723'
                            },
                            mt: 1
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={handleCloseNewDialog}
                        sx={{
                            color: themeColors.accent || '#A67C52',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)'
                            }
                        }}
                    >
                        取消
                    </Button>
                    <Button 
                        onClick={handleCreateWordbook} 
                        variant="contained" 
                        disabled={dialogLoading}
                        sx={{
                            borderRadius: '8px',
                            background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                            boxShadow: `0 4px 12px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.2)'}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: `0 6px 15px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                            }
                        }}
                    >
                        {dialogLoading ? <div className="spinner" style={{ width: 24, height: 24 }} /> : '创建'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 编辑单词书对话框 */}
            <Dialog
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        backgroundColor: themeColors.primary || '#F3E9DD'
                    },
                    elevation: 2
                }}
            >
                <DialogTitle 
                    sx={{ 
                        background: `linear-gradient(135deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                        color: themeColors.light || '#F8F4E9',
                        py: 2,
                    }}
                >
                    编辑单词书
                </DialogTitle>
                <DialogContent sx={{ mt: 2, minWidth: '400px' }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="单词书名称"
                        type="text"
                        fullWidth
                        value={editWordbookName}
                        onChange={(e) => setEditWordbookName(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${themeColors.borderColor || 'rgba(166, 124, 82, 0.3)'}`
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: `${themeColors.borderColorHover || 'rgba(166, 124, 82, 0.5)'}`
                            },
                            '& .MuiInputLabel-root': {
                                color: themeColors.accent || '#A67C52'
                            },
                            '& .MuiOutlinedInput-input': {
                                color: themeColors.text || '#3E2723'
                            },
                            mt: 1
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={handleCloseEditDialog}
                        sx={{
                            color: themeColors.accent || '#A67C52',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)'
                            }
                        }}
                    >
                        取消
                    </Button>
                    <Button 
                        onClick={handleUpdateWordbook} 
                        variant="contained" 
                        disabled={dialogLoading}
                        sx={{
                            borderRadius: '8px',
                            background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                            boxShadow: `0 4px 12px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.2)'}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: `0 6px 15px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                            }
                        }}
                    >
                        {dialogLoading ? <div className="spinner" style={{ width: 24, height: 24 }} /> : '保存'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 菜单 */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: { 
                        borderRadius: '12px', 
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        backgroundColor: themeColors.light || '#F8F4E9'
                    },
                    elevation: 2
                }}
            >
                <MenuItem 
                    onClick={handleOpenEditDialog}
                    sx={{
                        py: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)',
                        },
                        color: themeColors.text || '#3E2723'
                    }}
                >
                    <EditIcon fontSize="small" sx={{ mr: 1, color: themeColors.accent || '#A67C52' }} />
                    编辑
                </MenuItem>
                <MenuItem 
                    onClick={handleDeleteWordbook}
                    sx={{
                        py: 1.5,
                        color: '#f44336',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.08)',
                        }
                    }}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    删除
                </MenuItem>
            </Menu>

            {/* 通知 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ 
                        borderRadius: '12px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* 导入预设单词书对话框 */}
            <Dialog
                open={importDialogOpen}
                onClose={handleCloseImportDialog}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        backgroundColor: themeColors.primary || '#F3E9DD'
                    },
                    elevation: 2
                }}
            >
                <DialogTitle 
                    sx={{ 
                        background: `linear-gradient(135deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                        color: themeColors.light || '#F8F4E9',
                        py: 2,
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <CloudDownloadIcon sx={{ mr: 1 }} /> 导入预设单词书
                </DialogTitle>
                <DialogContent sx={{ mt: 2, minWidth: '400px', maxHeight: '60vh' }}>
                    {loadingPresets ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: themeColors.accent || '#A67C52' }} />
                        </Box>
                    ) : (
                        presetWordbooks.length === 0 ? (
                            <Alert 
                                severity="info" 
                                sx={{ 
                                    mt: 1,
                                    borderRadius: '8px'
                                }}
                            >
                                没有可用的预设单词书
                            </Alert>
                        ) : (
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel 
                                    component="legend"
                                    sx={{
                                        color: themeColors.accent || '#A67C52',
                                        mb: 1
                                    }}
                                >
                                    请选择要导入的单词书
                                </FormLabel>
                                <RadioGroup
                                    value={selectedPreset}
                                    onChange={(e) => setSelectedPreset(e.target.value)}
                                >
                                    {presetWordbooks.map((preset) => (
                                        <FormControlLabel
                                            key={preset.id}
                                            value={preset.id}
                                            control={
                                                <Radio 
                                                    sx={{
                                                        '&.Mui-checked': {
                                                            color: themeColors.accent || '#A67C52',
                                                        }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ 
                                                        fontWeight: 'medium',
                                                        color: themeColors.text || '#3E2723' // 确保文本颜色与主题匹配
                                                    }}>
                                                        {preset.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{
                                                        color: themeColors.secondary || '#C4A484' // 使用主题的次要颜色
                                                    }}>
                                                        {preset.description || '单词数量：' + (preset.wordCount || 'N/A')}
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{
                                                border: `1px solid ${themeColors.borderColor || 'rgba(166, 124, 82, 0.2)'}`,
                                                borderRadius: '8px',
                                                mb: 1,
                                                py: 1,
                                                px: 1,
                                                width: '100%',
                                                margin: 0,
                                                '&:hover': {
                                                    backgroundColor: themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)',
                                                },
                                            }}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        )
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={handleCloseImportDialog}
                        sx={{
                            color: themeColors.accent || '#A67C52',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.hoverBg || 'rgba(166, 124, 82, 0.08)'
                            }
                        }}
                    >
                        取消
                    </Button>
                    <Button 
                        onClick={handleImportPreset} 
                        variant="contained" 
                        disabled={dialogLoading || loadingPresets || presetWordbooks.length === 0}
                        startIcon={<CloudDownloadIcon />}
                        sx={{
                            borderRadius: '8px',
                            background: `linear-gradient(90deg, ${themeColors.accent || '#A67C52'}, ${themeColors.secondary || '#C4A484'})`,
                            boxShadow: `0 4px 12px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.2)'}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: `0 6px 15px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                            }
                        }}
                    >
                        {dialogLoading ? <div className="spinner" style={{ width: 24, height: 24 }} /> : '导入'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default WordbooksPage;