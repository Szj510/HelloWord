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
// import DeleteIcon from '@mui/icons-material/Delete';
// import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

function WordbooksPage() {
    const [wordbooks, setWordbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // --- V 新增: 对话框和表单状态 --- V
    const [openCreateDialog, setOpenCreateDialog] = useState(false); // 控制对话框打开/关闭
    const [newWordbookData, setNewWordbookData] = useState({ name: '', description: '' }); // 新单词书表单数据
    const [dialogLoading, setDialogLoading] = useState(false); // 对话框提交加载状态
    const [dialogError, setDialogError] = useState('');     // 对话框内错误信息
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    // --- ^ 新增结束 ^ ---

    // --- 获取单词书列表函数 (不变) ---
    const fetchWordbooks = useCallback(async () => {
        // ... (函数体不变) ...
         setLoading(true);
         setError('');
         try {
             const data = await apiFetch('/api/wordbooks');
             setWordbooks(data || []);
         } catch (err) {
             setError(`获取单词书列表失败: ${err.message}`);
             setWordbooks([]);
         } finally {
             setLoading(false);
         }
    }, []);

    // --- useEffect (不变) ---
    useEffect(() => {
        if (isAuthenticated) {
            fetchWordbooks();
        } else {
             setError("请先登录以查看您的单词书。");
             setLoading(false);
        }
    }, [isAuthenticated, fetchWordbooks]);


    // --- V 修改: 打开/关闭对话框的函数 --- V
    const handleOpenCreateDialog = () => {
        setNewWordbookData({ name: '', description: '' }); // 重置表单
        setDialogError(''); // 清除旧错误
        setOpenCreateDialog(true);
    };

    const handleCloseCreateDialog = () => {
        setOpenCreateDialog(false);
    };

    // 处理对话框表单输入变化
    const handleNewWordbookChange = (e) => {
        setNewWordbookData({ ...newWordbookData, [e.target.name]: e.target.value });
         if (dialogError && e.target.name === 'name') { // 如果错误是因为名字为空，用户输入时清除错误
             setDialogError('');
         }
    };

     // 显示 Snackbar 提示 (复用之前的)
     const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };
    // 关闭 Snackbar (复用之前的)
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') { return; }
        setSnackbarOpen(false);
    };


    // 处理创建单词书的表单提交
    const handleCreateSubmit = async () => {
        if (!newWordbookData.name.trim()) {
            setDialogError('单词书名称不能为空');
            return;
        }
        setDialogLoading(true);
        setDialogError('');

        try {
            const createdWordbook = await apiFetch('/api/wordbooks', {
                method: 'POST',
                body: JSON.stringify(newWordbookData)
            });
            handleCloseCreateDialog(); // 关闭对话框
            fetchWordbooks(); // 重新获取列表以显示新单词书
            showSnackbar(`单词书 "${createdWordbook.name}" 创建成功!`, 'success'); // 使用 Snackbar 提示

        } catch (err) {
            console.error("创建单词书失败:", err);
            setDialogError(`创建失败: ${err.message}`); // 在对话框内显示错误
             // showSnackbar(`创建失败: ${err.message}`, 'error'); // 或者用 Snackbar
        } finally {
            setDialogLoading(false);
        }
    };
    // --- ^ 修改/新增结束 ^ ---


    const handleDeleteWordbook = async (id) => { console.log(`TODO: 删除单词书 ${id}`); };
    const handleStartLearning = (wordbookId, wordCount) => { /* ... (不变) ... */
        if (wordCount === 0) {
            showSnackbar("这个单词书里还没有单词，请先添加单词。", "warning");
            return;
        }
        navigate(`/learn/${wordbookId}`);
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography component="h1" variant="h4">
                    我的单词书
                </Typography>
                {/* --- V 修改: 点击按钮打开对话框 --- V */}
                <Button variant="contained" onClick={handleOpenCreateDialog}>
                    创建新单词书
                </Button>
                {/* --- ^ 修改结束 ^ --- */}
            </Box>

            {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}

            {/* ... (单词书列表渲染 JSX 基本不变) ... */}
             {wordbooks.length === 0 && !loading && !error && (
                  <Typography>你还没有创建任何单词书。</Typography>
              )}
             {wordbooks.length > 0 && (
                 <List>
                     {wordbooks.map((book) => ( /* ... ListItem 内容不变 ... */
                          <ListItem
                              key={book._id}
                              sx={{ borderBottom: '1px solid #eee', '&:hover': { backgroundColor: '#f5f5f5' } }}
                          >
                              <ListItemText /* ... */
                                 primary={book.name}
                                 secondary={
                                     <>
                                         {book.description || '暂无描述'}
                                         <Typography variant="caption" display="block">
                                             单词数: {book.words?.length || 0}
                                             &nbsp;- 更新于: {new Date(book.updatedAt).toLocaleDateString()}
                                         </Typography>
                                     </>
                                 }
                              />
                              <ListItemSecondaryAction>
                                 <IconButton edge="end" aria-label="start learning" onClick={() => handleStartLearning(book._id, book.words?.length || 0)} sx={{ mr: 1 }} title="开始学习">
                                     <span role="img" aria-label="start learning">▶️</span>
                                 </IconButton>
                                 <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteWordbook(book._id)}>
                                     <span role="img" aria-label="delete">🗑️</span>
                                 </IconButton>
                              </ListItemSecondaryAction>
                          </ListItem>
                     ))}
                 </List>
             )}


            {/* --- V 新增: 创建单词书对话框 --- V */}
            <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}>
                <DialogTitle>创建新单词书</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        请输入新单词书的名称和可选的描述。
                    </DialogContentText>
                    {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
                    <TextField
                        autoFocus // 对话框打开时自动聚焦
                        margin="dense"
                        id="name"
                        name="name" // 必须和 state 中的 key 对应
                        label="单词书名称"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newWordbookData.name}
                        onChange={handleNewWordbookChange}
                        required // 标记为必需
                        error={!!dialogError && !newWordbookData.name.trim()} // 如果有错误且名字为空，显示错误状态
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        name="description" // 必须和 state 中的 key 对应
                        label="描述 (可选)"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newWordbookData.description}
                        onChange={handleNewWordbookChange}
                        multiline // 允许多行输入
                        rows={2}
                    />
                     {/* 可以添加 Level, Category, isPublic 等字段的输入 */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateDialog} disabled={dialogLoading}>取消</Button>
                    <Button onClick={handleCreateSubmit} disabled={dialogLoading}>
                        {dialogLoading ? <CircularProgress size={24} /> : '创建'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- ^ 新增结束 ^ --- */}

             {/* Snackbar 用于全局提示 (复用之前的) */}
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Container>
    );
}

export default WordbooksPage;