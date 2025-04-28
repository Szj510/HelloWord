import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';

// 引入 MUI 组件
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
// V--- 引入 Dialog 相关组件 ---V
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField'; // 用于对话框内的表单
import Snackbar from '@mui/material/Snackbar'; // 引入 Snackbar
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
// import DeleteIcon from '@mui/icons-material/Delete';
// import EditIcon from '@mui/icons-material/Edit';
// import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'; // 确认图标已安装或用 emoji 代替

// --- V 定义预设词典列表 (根据你的 seedWords.js 配置) --- V
const presetDictionaries = [
    { tag: 'CET4', name: '大学英语四级 T' },
    { tag: 'CET6', name: '大学英语六级 T' },
    { tag: 'GaoKao', name: '高考 3500' },
    { tag: 'KaoYan', name: '考研大纲词汇 2024' },
    { tag: 'IELTS', name: '雅思核心词汇 (顺序)' },
    { tag: 'IELTS_Disorder', name: '雅思核心词汇 (乱序)' },
    { tag: '4000EEW_Meaning', name: '4000 基本英语词汇 (含释义)' },
    { tag: '4000EEW_Sentence', name: '4000 基本英语词汇 (含例句)' },
    { tag: '2025KaoYan', name: '2025考研红宝书' },
    { tag: '2026KaoYan', name: '2026红宝书' },
    { tag: 'Special', name: '专项词汇' }
];

function WordbooksPage() {
    const [wordbooks, setWordbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // --- V 新增: 对话框和表单状态 --- V
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [newWordbookData, setNewWordbookData] = useState({ name: '', description: '' });
    const [creationType, setCreationType] = useState('empty'); // 'empty' or 'import'
    const [selectedDictionaryTag, setSelectedDictionaryTag] = useState(presetDictionaries.length > 0 ? presetDictionaries[0].tag : ''); // 默认选中第一个预设标签
    const [dialogLoading, setDialogLoading] = useState(false);
    const [dialogError, setDialogError] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    // --- ^ 新增结束 ^ ---
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [deletingBookId, setDeletingBookId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // --- 获取单词书列表函数 (不变) ---
    const fetchWordbooks = useCallback(async () => { /* ... */
         setLoading(true); setError(''); try { const data = await apiFetch('/api/wordbooks'); setWordbooks(data || []); } catch (err) { setError(`获取单词书列表失败: ${err.message}`); setWordbooks([]); } finally { setLoading(false); }
     }, []);
    useEffect(() => { if (isAuthenticated) { fetchWordbooks(); } else { setError("请先登录以查看您的单词书。"); setLoading(false); } }, [isAuthenticated, fetchWordbooks]);
    const showSnackbar = (message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); };
    const handleSnackbarClose = (event, reason) => { if (reason === 'clickaway') { return; } setSnackbarOpen(false); };


    const handleOpenCreateDialog = () => {
        setNewWordbookData({ name: '', description: '' });
        setCreationType('empty'); // 默认创建空
        setSelectedDictionaryTag(presetDictionaries.length > 0 ? presetDictionaries[0].tag : ''); // 重置选中标签
        setDialogError('');
        setOpenCreateDialog(true);
    };
    const handleCloseCreateDialog = () => { setOpenCreateDialog(false); };
    const handleNewWordbookChange = (e) => { setNewWordbookData({ ...newWordbookData, [e.target.name]: e.target.value }); if (dialogError && e.target.name === 'name') { setDialogError(''); } };

    // --- V 新增: 处理创建类型和预设词典选择变化 --- V
    const handleCreationTypeChange = (event) => {
        setCreationType(event.target.value);
        setDialogError(''); // 切换类型时清除错误
    };
    const handleDictionaryTagChange = (event) => {
        setSelectedDictionaryTag(event.target.value);
        // (可选) 自动填充名称为选中的词典名称
        // const selectedDict = presetDictionaries.find(d => d.tag === event.target.value);
        // if (selectedDict) {
        //    setNewWordbookData(prev => ({...prev, name: selectedDict.name}));
        // }
    };
    
    // 处理创建单词书的表单提交
    const handleCreateSubmit = async () => {
        if (!newWordbookData.name.trim()) {
            setDialogError('单词书名称不能为空');
            return;
        }
        if (creationType === 'import' && !selectedDictionaryTag) {
             setDialogError('请选择要导入的预设词典');
             return;
         }

        setDialogLoading(true);
        setDialogError('');

        try {
            let createdWordbook;
            if (creationType === 'import') {
                // 调用导入 API
                createdWordbook = await apiFetch('/api/wordbooks/import', {
                    method: 'POST',
                    body: JSON.stringify({
                         dictionaryTag: selectedDictionaryTag,
                         name: newWordbookData.name,
                         description: newWordbookData.description
                    })
                });
                 showSnackbar(`从 "${presetDictionaries.find(d => d.tag === selectedDictionaryTag)?.name || selectedDictionaryTag}" 导入 "${createdWordbook.name}" 成功!`, 'success');
            } else {
                // 调用创建空单词书 API
                createdWordbook = await apiFetch('/api/wordbooks', {
                    method: 'POST',
                    body: JSON.stringify(newWordbookData) // 只发送 name 和 description
                });
                 showSnackbar(`单词书 "${createdWordbook.name}" 创建成功!`, 'success');
            }
            handleCloseCreateDialog();
            fetchWordbooks(); // 刷新列表

        } catch (err) {
            console.error("创建/导入单词书失败:", err);
            setDialogError(`操作失败: ${err.message}`);
        } finally {
            setDialogLoading(false);
        }
    };

    // 打开删除确认对话框
    const handleOpenDeleteConfirm = (id) => {
        setDeletingBookId(id);
        setOpenDeleteConfirm(true);
    };

    // 关闭删除确认对话框
    const handleCloseDeleteConfirm = () => {
        setOpenDeleteConfirm(false);
        setDeletingBookId(null); // 清除 ID
    };

    // 处理确认删除
    const handleConfirmDelete = async () => {
        if (!deletingBookId) return;
        setDeleteLoading(true); // 开始删除，设置 loading
        try {
            const response = await apiFetch(`/api/wordbooks/${deletingBookId}`, { method: 'DELETE' });
            showSnackbar(response.msg || '单词书删除成功！', 'success');
            fetchWordbooks(); // 删除成功后刷新列表
            handleCloseDeleteConfirm(); // 关闭确认对话框
        } catch (err) {
            console.error(`删除单词书 ${deletingBookId} 失败:`, err);
            showSnackbar(`删除失败: ${err.message}`, 'error');
            // 可以选择不关闭对话框，让用户重试
        } finally {
            setDeleteLoading(false); // 结束删除 loading
        }
    };
    const handleStartLearning = (wordbookId, wordCount) => { /* ... (不变) ... */
        if (wordCount === 0) {
            showSnackbar("这个单词书里还没有单词，请先添加单词。", "warning");
            return;
        }
        const defaultNewLimit = 10;
        const defaultReviewLimit = 30;
        navigate(`/learn/${wordbookId}?newLimit=${defaultNewLimit}&reviewLimit=${defaultReviewLimit}`);
    };


    if (loading && !openCreateDialog) { /* ... loading JSX ... */ // 仅在主列表加载时显示全局 loading
         return (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                 <CircularProgress />
             </Box>
         );
     }


    return (
        <Container maxWidth="md">
            {/* ... (标题和创建按钮 JSX， 点击改为 handleOpenCreateDialog ) ... */}
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}> <Typography component="h1" variant="h4"> 我的单词书 </Typography> <Button variant="contained" onClick={handleOpenCreateDialog}> 创建新单词书 </Button> </Box>

            {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}
            {/* ... (单词书列表渲染 JSX 不变) ... */}
            {wordbooks.length === 0 && !loading && !error && (<Typography>你还没有创建任何单词书。</Typography>)}
            {wordbooks.length > 0 && (
                 <List>
                     {wordbooks.map((book) => (
                          <ListItem
                                key={book._id}
                                // V--- 添加以下两行 ---V
                                component={RouterLink}
                                to={`/wordbooks/${book._id}`}
                                // --- ^ 添加结束 ^ ---
                                sx={{ borderBottom: '1px solid #eee', '&:hover': { backgroundColor: '#f5f5f5', cursor: 'pointer' } }} // 添加 cursor
                            >
                              <ListItemText 
                                primary={book.name}
                                secondary={
                                  <>
                                    {book.description && `${book.description} • `}
                                    {`${book.words?.length || 0} 个单词`}
                                  </>
                                }
                              />
                              <ListItemSecondaryAction>
                                 <IconButton edge="end" aria-label="start learning" onClick={() => handleStartLearning(book._id, book.words?.length || 0)} sx={{ mr: 1 }} title="开始学习">
                                     <span role="img" aria-label="start learning">▶️</span>
                                 </IconButton>
                                 {/* V--- 修改删除按钮 onClick ---V */}
                                 <IconButton edge="end" aria-label="delete" onClick={() => handleOpenDeleteConfirm(book._id)}>
                                     <span role="img" aria-label="delete">🗑️</span>
                                 </IconButton>
                                 {/* --- ^ 修改结束 ^ --- */}
                              </ListItemSecondaryAction>
                          </ListItem>
                     ))}
                 </List>
             )}
            {/* --- V 修改: 创建对话框内容 --- V */}
            <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}>
                <DialogTitle>创建新单词书</DialogTitle>
                <DialogContent>
                    {/* <DialogContentText sx={{ mb: 2 }}>
                        请选择创建方式并填写信息。
                    </DialogContentText> */}
                     {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}

                    {/* 创建类型选择 */}
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                        {/* <FormLabel component="legend">创建方式</FormLabel> */}
                        <RadioGroup
                            row
                            aria-label="creation-type"
                            name="creation-type-radio-group"
                            value={creationType}
                            onChange={handleCreationTypeChange}
                        >
                            <FormControlLabel value="empty" control={<Radio />} label="创建空单词书" />
                            <FormControlLabel value="import" control={<Radio />} label="从预设导入" />
                        </RadioGroup>
                    </FormControl>

                    {/* 预设词典选择 (仅当类型为 'import' 时显示) */}
                    {creationType === 'import' && (
                         <FormControl fullWidth margin="dense" required error={!!dialogError && !selectedDictionaryTag}>
                             <InputLabel id="preset-dictionary-select-label">选择预设词典</InputLabel>
                             <Select
                                 labelId="preset-dictionary-select-label"
                                 id="preset-dictionary-select"
                                 value={selectedDictionaryTag}
                                 label="选择预设词典"
                                 onChange={handleDictionaryTagChange}
                             >
                                 {presetDictionaries.map((dict) => (
                                     <MenuItem key={dict.tag} value={dict.tag}>{dict.name}</MenuItem>
                                 ))}
                             </Select>
                         </FormControl>
                    )}


                    {/* 单词书名称 (始终需要) */}
                    <TextField
                        autoFocus={creationType === 'empty'} // 创建空时自动聚焦名称
                        margin="dense"
                        id="name"
                        name="name"
                        label="单词书名称"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newWordbookData.name}
                        onChange={handleNewWordbookChange}
                        required
                        error={!!dialogError && !newWordbookData.name.trim()}
                    />
                    {/* 描述 (可选) */}
                    <TextField
                        margin="dense"
                        id="description"
                        name="description"
                        label="描述 (可选)"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newWordbookData.description}
                        onChange={handleNewWordbookChange}
                        multiline
                        rows={2}
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateDialog} disabled={dialogLoading}>取消</Button>
                    <Button onClick={handleCreateSubmit} disabled={dialogLoading}>
                        {dialogLoading ? <CircularProgress size={24} /> : '创建'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- ^ 修改结束 ^ --- */}
            <Dialog
                open={openDeleteConfirm}
                onClose={handleCloseDeleteConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"确认删除单词书?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        删除单词书后，相关的学习记录可能也会丢失（取决于后端实现），确定要删除吗？
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirm} disabled={deleteLoading}>取消</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={24} color="inherit" /> : '确认删除'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar (不变) */}
             <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                 <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                     {snackbarMessage}
                 </Alert>
             </Snackbar>

        </Container>
    );
}

export default WordbooksPage;