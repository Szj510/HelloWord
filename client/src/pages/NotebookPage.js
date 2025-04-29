import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';
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

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'; // 移除图标
import FileUploadIcon from '@mui/icons-material/FileUpload'; // 导出图标

function NotebookPage() {
    const [groupedEntries, setGroupedEntries] = useState([]); // 按单词书分组的条目
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

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


    if (loading) { return ( <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> ); }
    if (error) { return ( <Container maxWidth="sm"><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container> ); }


    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
                <Typography component="h1" variant="h4">
                    我的生词本
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<FileUploadIcon />}
                    onClick={handleOpenExportDialog}
                    disabled={groupedEntries.length === 0} // 如果没有条目则禁用
                >
                    导出为新单词书
                </Button>
            </Box>

            {groupedEntries.length === 0 && !loading && (
                <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                    生词本是空的，在学习过程中点击单词卡片左上角的 ☆ 图标添加生词吧！
                </Typography>
            )}

            {groupedEntries.map((group, index) => {
                const accordionId = `panel-${index}-${group.wordbookId || 'unknown'}`;
                return (
                <Accordion 
                    key={accordionId}
                    defaultExpanded={true}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`${accordionId}-content`}
                        id={`${accordionId}-header`}
                    >
                        <Typography sx={{ flexShrink: 0, mr: 2 }}>
                            来源: {group.wordbookName || '未知来源'}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                            ({group.entries?.length || 0} 个单词)
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails id={`${accordionId}-content`}>
                        <List dense>
                            {group.entries?.map((entry) => (
                                <ListItem
                                    key={entry.entryId || entry.wordId} // 优先用 entryId
                                    divider
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="remove from notebook"
                                            onClick={() => handleRemoveWord(entry.wordId, entry.spelling)}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={entry.spelling}
                                        secondary={`[${entry.phonetic || 'N/A'}] ${entry.meaning || 'N/A'}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
                );
            })}

             {/* 导出对话框 */}
             <Dialog open={openExportDialog} onClose={handleCloseExportDialog}>
                 <DialogTitle>导出生词本</DialogTitle>
                 <DialogContent>
                      {exportError && <Alert severity="error" sx={{ mb: 2 }}>{exportError}</Alert>}
                     <TextField
                         autoFocus
                         margin="dense"
                         id="newWordbookName"
                         label="新单词书名称"
                         type="text"
                         fullWidth
                         variant="standard"
                         value={newWordbookName}
                         onChange={(e) => setNewWordbookName(e.target.value)}
                         required
                         error={!!exportError && !newWordbookName.trim()}
                     />
                     {/* 可以添加描述输入框 */}
                 </DialogContent>
                 <DialogActions>
                     <Button onClick={handleCloseExportDialog} disabled={exportLoading}>取消</Button>
                     <Button onClick={handleExportSubmit} disabled={exportLoading}>
                         {exportLoading ? <CircularProgress size={24} /> : '确认导出'}
                     </Button>
                 </DialogActions>
             </Dialog>


            {/* Snackbar */}
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} /* ... */ >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
        </Container>
    );
}

export default NotebookPage;