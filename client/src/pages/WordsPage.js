import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // 用于检查登录状态和获取 token (通过 apiFetch 自动使用)
import apiFetch from '../utils/api'; // 引入封装的 apiFetch

// 引入 MUI 组件
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import Snackbar from '@mui/material/Snackbar'; // 用于显示简短的成功/错误消息

function WordsPage() {
  const { isAuthenticated } = useAuth(); // 检查用户是否登录，以启用“添加到单词本”功能
  const [words, setWords] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // 单独管理当前页码状态

  const [userWordbooks, setUserWordbooks] = useState([]);
  const [selectedWordbookId, setSelectedWordbookId] = useState('');
  const [addWordStatus, setAddWordStatus] = useState({}); // { wordId: 'loading' | 'success' | 'error', message: '...' }
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error' | 'info' | 'warning'

  // 获取单词列表
  const fetchWords = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 }); // 每页显示10个
      if (search) {
        params.append('search', search);
      }
      const data = await apiFetch(`/api/words?${params.toString()}`);
      setWords(data.words || []);
      setPagination({ currentPage: data.currentPage, totalPages: data.totalPages });
    } catch (err) {
      setError(`获取单词失败: ${err.message}`);
      setWords([]); // 清空单词
      setPagination({ currentPage: 1, totalPages: 1 }); // 重置分页
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取用户的单词书列表
  const fetchUserWordbooks = useCallback(async () => {
    if (!isAuthenticated) return; // 未登录则不获取
    try {
      const data = await apiFetch('/api/wordbooks');
      setUserWordbooks(data || []);
      if (data && data.length > 0 && !selectedWordbookId) {
        // 默认选中第一个单词书 (如果之前没选过)
        setSelectedWordbookId(data[0]._id);
      }
    } catch (err) {
      console.error('获取用户单词书失败:', err);
      // 可以选择显示错误提示
      showSnackbar(`获取单词书列表失败: ${err.message}`, 'error');
    }
  }, [isAuthenticated, selectedWordbookId]); // 依赖认证状态

  // 组件加载时获取初始数据
  useEffect(() => {
    fetchWords(currentPage, searchTerm);
  }, [fetchWords, currentPage, searchTerm]); // 依赖项改变时重新获取

  // 组件加载时获取用户单词书 (仅当用户已登录)
  useEffect(() => {
    fetchUserWordbooks();
  }, [fetchUserWordbooks]); // 依赖 fetchUserWordbooks (它内部依赖 isAuthenticated)

  // 处理搜索输入
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 处理搜索提交 (可以改为 debounce 或在输入变化时直接搜索)
  const handleSearchSubmit = () => {
    setCurrentPage(1); // 搜索时回到第一页
    fetchWords(1, searchTerm);
  };

  // 处理分页变化
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchWords(value, searchTerm); // 使用新的页码获取数据
  };

  // 处理单词书选择变化
  const handleWordbookChange = (event) => {
    setSelectedWordbookId(event.target.value);
  };

  // 显示 Snackbar 提示
   const showSnackbar = (message, severity = 'success') => {
       setSnackbarMessage(message);
       setSnackbarSeverity(severity);
       setSnackbarOpen(true);
   };

   // 关闭 Snackbar
   const handleSnackbarClose = (event, reason) => {
       if (reason === 'clickaway') {
           return;
       }
       setSnackbarOpen(false);
   };


  // 处理添加单词到单词书
  const handleAddWord = async (wordId) => {
    if (!selectedWordbookId) {
      showSnackbar('请先选择一个单词书', 'warning');
      return;
    }
    if (!isAuthenticated) {
      showSnackbar('请先登录再添加单词', 'error');
      // 可以选择跳转到登录页: navigate('/login');
      return;
    }

    setAddWordStatus((prev) => ({ ...prev, [wordId]: { status: 'loading' } }));

    try {
      const response = await apiFetch(`/api/wordbooks/${selectedWordbookId}/words`, {
        method: 'POST',
        body: JSON.stringify({ wordId }),
      });
      setAddWordStatus((prev) => ({ ...prev, [wordId]: { status: 'success', message: response.msg || '添加成功' } }));
      showSnackbar(response.msg || '单词添加成功！', 'success');
    } catch (err) {
      console.error(`添加单词 ${wordId} 失败:`, err);
      const errorMessage = err.message || '添加失败';
      setAddWordStatus((prev) => ({ ...prev, [wordId]: { status: 'error', message: errorMessage } }));
      showSnackbar(`添加失败: ${errorMessage}`, 'error');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography component="h1" variant="h4" gutterBottom>
        单词列表
      </Typography>

      {/* 搜索区域 */}
      <Box sx={{ display: 'flex', gap: 1, marginBottom: 2 }}>
        <TextField
          label="搜索单词 (按拼写)"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()} //回车搜索
        />
        <Button variant="contained" onClick={handleSearchSubmit}>搜索</Button>
      </Box>

      {/* 加载与错误提示 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginY: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}

      {/* 单词列表 */}
      {!loading && !error && words.length === 0 && (
        <Typography>没有找到单词。</Typography>
      )}
      {!loading && words.length > 0 && (
        <>
          {/* 添加到单词书选择器 (仅登录后显示) */}
          {isAuthenticated && userWordbooks.length > 0 && (
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
              <InputLabel id="wordbook-select-label">添加到单词书</InputLabel>
              <Select
                labelId="wordbook-select-label"
                id="wordbook-select"
                value={selectedWordbookId}
                label="添加到单词书"
                onChange={handleWordbookChange}
              >
                {userWordbooks.map((book) => (
                  <MenuItem key={book._id} value={book._id}>{book.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
           {isAuthenticated && userWordbooks.length === 0 && (
               <Alert severity="warning" sx={{ marginBottom: 2 }}>你还没有创建任何单词书，请先创建。</Alert>
           )}


          <List>
            {words.map((word) => {
              const statusInfo = addWordStatus[word._id] || {};
              const isAdding = statusInfo.status === 'loading';
              const isSuccess = statusInfo.status === 'success';
              const hasError = statusInfo.status === 'error';

              return (
                <ListItem
                  key={word._id}
                  secondaryAction={
                    isAuthenticated && ( // 只有登录用户才能看到添加按钮
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddWord(word._id)}
                        disabled={isAdding || isSuccess} // 正在添加或已成功时禁用
                      >
                        {isAdding ? <CircularProgress size={20} /> : (isSuccess ? '已添加' : '添加')}
                      </Button>
                    )
                  }
                  sx={{ borderBottom: '1px solid #eee' }}
                >
                  <ListItemText
                    primary={word.spelling}
                    secondary={
                      <>
                        {word.phonetic && `[${word.phonetic}] `}
                        {word.meaning}
                        {hasError && <Typography variant="caption" color="error" sx={{display:'block'}}> 添加失败: {statusInfo.message}</Typography>}
                      </>
                      }
                  />
                </ListItem>
              );
            })}
          </List>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage} // 使用单独的 currentPage 状态
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
       {/* Snackbar 用于全局提示 */}
       <Snackbar
           open={snackbarOpen}
           autoHideDuration={4000} // 4秒后自动隐藏
           onClose={handleSnackbarClose}
           anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // 位置
       >
           {/* Alert 作为 Snackbar 的内容，可以显示不同严重性 */}
           <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
               {snackbarMessage}
           </Alert>
       </Snackbar>
    </Container>
  );
}

export default WordsPage;