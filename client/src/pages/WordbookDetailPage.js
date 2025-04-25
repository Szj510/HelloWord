import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext'; // 检查登录

// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider'; // 分割线
import IconButton from '@mui/material/IconButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Snackbar from '@mui/material/Snackbar';
// import DeleteIcon from '@mui/icons-material/Delete'; // 删除单词图标

function WordbookDetailPage() {
    const { id: wordbookId } = useParams(); // 从 URL 获取单词书 ID
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [wordbook, setWordbook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // 获取单词书详情的函数
    const fetchWordbookDetail = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // 后端 GET /api/wordbooks/:id 已经配置了 populate words
            const data = await apiFetch(`/api/wordbooks/${wordbookId}`);
            setWordbook(data);
        } catch (err) {
            setError(`获取单词书详情失败: ${err.message}`);
            setWordbook(null);
            // 如果是 403 或 404，可能需要特殊处理
            if (err.response && (err.response.status === 403 || err.response.status === 404)) {
                 setError(`无法加载单词书：${err.message}`); // 使用后端返回的错误信息
            }
        } finally {
            setLoading(false);
        }
    }, [wordbookId]); // 依赖 wordbookId

    // 组件加载时获取数据
    useEffect(() => {
        if (isAuthenticated) { // 确认登录才获取
             fetchWordbookDetail();
        } else {
            setError("请先登录。");
            setLoading(false);
        }
    }, [isAuthenticated, fetchWordbookDetail]); // 依赖认证状态和获取函数

    // 从单词书中删除单词
    const handleDeleteWordFromBook = async (wordIdToRemove) => {
       // 添加确认框
       if (!window.confirm(`确定要从《${wordbook?.name || '此单词书'}》中移除这个单词吗？`)) {
           return;
       }

       // 可以添加局部 loading 状态，或者暂时简单处理
       // setLoading(true); // 避免使用全局 loading

       try {
         const response = await apiFetch(`/api/wordbooks/${wordbookId}/words/${wordIdToRemove}`, { method: 'DELETE' });
         showSnackbar(response.msg || '单词移除成功！', 'success');
         // 删除成功后刷新单词列表
         fetchWordbookDetail(); // 重新获取单词书详情
       } catch (err) {
         console.error(`移除单词 ${wordIdToRemove} 失败:`, err);
         showSnackbar(`移除失败: ${err.message}`, 'error');
       } finally {
            // setLoading(false); // 如果使用了全局 loading
       }
    };

    const showSnackbar = (message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); };
    const handleSnackbarClose = (event, reason) => { if (reason === 'clickaway') { return; } setSnackbarOpen(false); };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error}
                    <Button component={RouterLink} to="/wordbooks" sx={{ ml: 2 }}>返回列表</Button>
                </Alert>
            </Container>
        );
    }

     if (!wordbook) { // 如果没在加载也没错误，但 wordbook 为 null
         return (
             <Container maxWidth="sm">
                 <Alert severity="warning" sx={{ mt: 4 }}>未找到单词书数据。</Alert>
             </Container>
         );
     }

    // 正常显示详情
    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 2 }}>
                 <Button component={RouterLink} to="/wordbooks">
                     {/* <ArrowBackIcon sx={{ mr: 1 }} /> */}
                     返回我的单词书
                 </Button>
            </Box>

            <Typography variant="h4" gutterBottom>{wordbook.name}</Typography>
            {wordbook.description && <Typography variant="body1" color="text.secondary" paragraph>{wordbook.description}</Typography>}
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                共 {wordbook.words?.length || 0} 个单词 |
                级别: {wordbook.level || '未指定'} |
                分类: {wordbook.category || '未指定'} |
                更新于: {new Date(wordbook.updatedAt).toLocaleString()}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h5" gutterBottom>包含的单词</Typography>
            {wordbook.words && wordbook.words.length > 0 ? (
                <List>
                    {wordbook.words.map((word) => (
                        <ListItem key={word._id} divider>
                            <ListItemText
                                primary={word.spelling}
                                secondary={`[${word.phonetic || 'N/A'}] ${word.meaning || 'N/A'}`}
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="delete word" onClick={() => handleDeleteWordFromBook(word._id)}>
                                     <span role="img" aria-label="delete word">➖</span>
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography sx={{ mt: 2 }}>这本单词书还没有添加任何单词。</Typography>
            )}
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                 <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}> {snackbarMessage} </Alert>
             </Snackbar>
        </Container>
    );
}

export default WordbookDetailPage;