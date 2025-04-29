import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';
import dayjs from 'dayjs';

// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';

function NotebookPage() {
    const [groupedEntries, setGroupedEntries] = useState([]); // 按单词书分组的条目
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
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

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Export Dialog state
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [newWordbookName, setNewWordbookName] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState('');

    // Snackbar functions
    const showSnackbar = (message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); };
    const handleSnackbarClose = (event, reason) => { if (reason === 'clickaway') { return; } setSnackbarOpen(false); };

    // 获取生词本数据 (按单词书分组)
    const fetchNotebookData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            // 调用获取分组数据的 API
            const data = await apiFetch('/api/notebook/entries');
            setGroupedEntries(data || []);
        } catch (err) {
            setError(`获取生词本数据失败: ${err.message}`);
            setGroupedEntries([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotebookData();
        } else {
            setError("请先登录查看生词本。"); setLoading(false);
        }
    }, [isAuthenticated, fetchNotebookData]);

    // 处理从生词本移除单词
    const handleRemoveWord = async (wordId, spelling) => {
         if (!window.confirm(`确定要从生词本中移除 "${spelling}" 吗？`)) { return; }
         // 可以添加局部 loading 状态指示
         try {
             const response = await apiFetch(`/api/notebook/entries/${wordId}`, { method: 'DELETE' });
             showSnackbar(response.msg || `"${spelling}" 已从生词本移除`, 'success');
             // 移除成功后刷新列表
             fetchNotebookData();
         } catch (err) {
              console.error(`移除单词 ${wordId} 失败:`, err);
              showSnackbar(`移除失败: ${err.message}`, 'error');
          }
    };

    // --- 导出功能相关函数 ---
    const handleOpenExportDialog = () => {
         // 检查生词本是否为空
         const totalWords = groupedEntries.reduce((sum, group) => sum + group.entries.length, 0);
         if (totalWords === 0) {
             showSnackbar("生词本是空的，无法导出。", "warning");
             return;
         }
        setNewWordbookName(`我的生词本 - ${dayjs().format('YYYYMMDD')}`); // 默认名称
        setExportError('');
        setOpenExportDialog(true);
    };
    const handleCloseExportDialog = () => setOpenExportDialog(false);
    const handleExportSubmit = async () => {
        if (!newWordbookName.trim()) { setExportError("单词书名称不能为空"); return; }
        setExportLoading(true); setExportError('');
        try {
            const response = await apiFetch('/api/notebook/export', {
                method: 'POST',
                body: JSON.stringify({ name: newWordbookName, description: "从生词本导出" })
            });
            handleCloseExportDialog();
            showSnackbar(response.msg || "导出成功！", "success");
            // 可以选择跳转到新的单词书详情页或单词书列表页
            // navigate(`/wordbooks/${response.wordbook?._id}`);
            navigate('/wordbooks'); // 跳转到列表页

        } catch (err) {
             console.error("导出生词本失败:", err);
             setExportError(`导出失败: ${err.message}`);
         } finally {
             setExportLoading(false);
         }
    };
    // --- 导出功能结束 ---


    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in">
                <div className="spinner" style={{ width: 60, height: 60 }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'medium', color: 'text.secondary' }}>
                    正在加载生词本...
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


    return (
        <Container maxWidth="lg" className="animate-fade-in">
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
                        background: `linear-gradient(90deg, ${themeColors.accent || themeColors.caramelBrown}, ${themeColors.secondary || themeColors.deepMilkTea})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: themeColors.text || '#3E2723'
                    }}
                >
                    <BookmarkIcon sx={{ mr: 1.5, fontSize: '2rem', color: themeColors.accent || themeColors.caramelBrown }} />
                    我的生词本
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<FileUploadIcon />}
                    onClick={handleOpenExportDialog}
                    disabled={groupedEntries.length === 0}
                    sx={{
                        borderRadius: '50px',
                        py: 1,
                        px: 3,
                        background: `linear-gradient(90deg, ${themeColors.accent || themeColors.caramelBrown}, ${themeColors.secondary || themeColors.deepMilkTea})`,
                        boxShadow: `0 8px 16px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.3)'}`,
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: `0 12px 20px ${themeColors.boxShadow || 'rgba(166, 124, 82, 0.4)'}`,
                            transform: 'translateY(-3px)'
                        },
                    }}
                >
                    导出为新单词书
                </Button>
            </Box>

            {groupedEntries.length === 0 && !loading && (
                <Fade in={true} timeout={800}>
                    <Paper
                        elevation={0}
                        className="card-glass"
                        sx={{
                            p: 5,
                            borderRadius: '16px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            backgroundColor: themeColors.light || '#F8F4E9',
                        }}
                    >
                        <BookmarkIcon sx={{ fontSize: '4rem', color: themeColors.accent || '#A67C52', opacity: 0.7 }} />
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 'medium',
                                color: themeColors.text || '#3E2723'
                            }}
                        >
                            生词本是空的
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: themeColors.text || '#3E2723',
                                maxWidth: '500px'
                            }}
                        >
                            在学习过程中点击单词卡片左上角的 ☆ 图标添加生词吧！
                        </Typography>
                    </Paper>
                </Fade>
            )}

            {groupedEntries.map((group, index) => {
                const accordionId = `panel-${index}-${group.wordbookId || 'unknown'}`;
                return (
                <Fade
                    in={true}
                    timeout={800 + index * 200}
                    key={accordionId}
                >
                    <Accordion
                        defaultExpanded={true}
                        elevation={0}
                        className="card-neumorphic"
                        sx={{
                            mb: 3,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
                            '&::before': {
                                display: 'none' // 移除默认的分隔线
                            }
                        }}
                        component={Paper} // 显式指定为Paper组件
                    >
                        <AccordionSummary
                            expandIcon={
                                <ExpandMoreIcon
                                    sx={{
                                        color: themeColors.accent || '#A67C52',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            }
                            aria-controls={`${accordionId}-content`}
                            id={`${accordionId}-header`}
                            sx={{
                                background: `rgba(${themeColors.colors ? themeColors.colors.c2 : '210, 180, 140'}, 0.2)`,
                                '&:hover': {
                                    background: `rgba(${themeColors.colors ? themeColors.colors.c2 : '210, 180, 140'}, 0.3)`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexGrow: 1
                                }}
                            >
                                <MenuBookIcon
                                    sx={{
                                        mr: 2,
                                        color: themeColors.accent || '#A67C52'
                                    }}
                                />
                                <Typography
                                    sx={{
                                        flexShrink: 0,
                                        mr: 2,
                                        fontWeight: 'bold',
                                        color: themeColors.text || '#3E2723'
                                    }}
                                >
                                    来源: {group.wordbookName || '未知来源'}
                                </Typography>
                                <Chip
                                    label={`${group.entries?.length || 0} 个单词`}
                                    size="small"
                                    sx={{
                                        bgcolor: `rgba(${themeColors.colors ? themeColors.colors.c1 : '166, 124, 82'}, 0.1)`,
                                        color: themeColors.accent || '#A67C52',
                                        fontWeight: 'medium'
                                    }}
                                />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails
                            id={`${accordionId}-content`}
                            sx={{ p: 0 }}
                        >
                            <List sx={{ p: 0 }}>
                                {group.entries?.map((entry, entryIndex) => (
                                    <Zoom
                                        in={true}
                                        style={{
                                            transitionDelay: `${entryIndex * 50}ms`,
                                        }}
                                        key={entry.entryId || entry.wordId}
                                    >
                                        <ListItem
                                            divider={entryIndex < group.entries.length - 1}
                                            sx={{
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    backgroundColor: `rgba(${themeColors.colors ? themeColors.colors.c2 : '196, 164, 132'}, 0.1)`
                                                },
                                                py: 1.5
                                            }}
                                            secondaryAction={(
                                                <Tooltip title="从生词本移除">
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="remove from notebook"
                                                        onClick={() => handleRemoveWord(entry.wordId, entry.spelling)}
                                                        sx={{
                                                            color: themeColors.accent || '#A67C52',
                                                            opacity: 0.7,
                                                            '&:hover': {
                                                                backgroundColor: `rgba(${themeColors.colors ? themeColors.colors.c1 : '166, 124, 82'}, 0.1)`,
                                                                opacity: 1
                                                            }
                                                        }}
                                                    >
                                                        <DeleteOutlineIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        >
                                            <ListItemText
                                                primary={(
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: themeColors.accent || '#A67C52'
                                                        }}
                                                    >
                                                        {entry.spelling}
                                                    </Typography>
                                                )}
                                                secondary={(
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            component="span"
                                                            sx={{
                                                                color: themeColors.secondary || '#C4A484',
                                                                mr: 1,
                                                                display: 'inline-flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            [{entry.phonetic || 'N/A'}]
                                                            <IconButton
                                                                size="small"
                                                                sx={{
                                                                    ml: 0.5,
                                                                    color: themeColors.secondary || '#C4A484',
                                                                    '&:hover': {
                                                                        backgroundColor: `rgba(${themeColors.colors ? themeColors.colors.c2 : '196, 164, 132'}, 0.1)`
                                                                    }
                                                                }}
                                                            >
                                                                <VolumeUpIcon fontSize="small" />
                                                            </IconButton>
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2" 
                                                            component="span"
                                                            sx={{ color: themeColors.text || '#3E2723' }}
                                                        >
                                                            {entry.meaning || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            />
                                        </ListItem>
                                    </Zoom>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                </Fade>
                );
            })}

            {/* 导出对话框 */}
            <Dialog
                open={openExportDialog}
                onClose={handleCloseExportDialog}
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
                    导出生词本
                </DialogTitle>
                <DialogContent sx={{ mt: 2, minWidth: '400px' }}>
                    {exportError && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                                borderRadius: '8px'
                            }}
                        >
                            {exportError}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        id="newWordbookName"
                        label="新单词书名称"
                        type="text"
                        fullWidth
                        value={newWordbookName}
                        onChange={(e) => setNewWordbookName(e.target.value)}
                        required
                        error={!!exportError && !newWordbookName.trim()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: `rgba(${themeColors.colors ? themeColors.colors.c1 : '166, 124, 82'}, 0.3)`
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: `rgba(${themeColors.colors ? themeColors.colors.c1 : '166, 124, 82'}, 0.5)`
                            },
                            '& .MuiInputLabel-root': {
                                color: themeColors.accent || '#A67C52'
                            },
                            '& .MuiOutlinedInput-input': {
                                color: themeColors.text || '#3E2723'
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseExportDialog}
                        disabled={exportLoading}
                        sx={{
                            color: themeColors.accent || '#A67C52',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: `rgba(${themeColors.colors ? themeColors.colors.c1 : '166, 124, 82'}, 0.08)`
                            }
                        }}
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleExportSubmit}
                        variant="contained"
                        disabled={exportLoading}
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
                        {exportLoading ? <CircularProgress size={24} /> : '确认导出'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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

export default NotebookPage;