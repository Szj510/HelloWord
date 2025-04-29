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
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookIcon from '@mui/icons-material/Book';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

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
            <Container maxWidth="md" sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in">
                <div className="spinner" style={{ width: 60, height: 60 }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'medium', color: 'text.secondary' }}>
                    正在加载单词书...
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
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                        {error}
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/wordbooks"
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            mt: 1,
                            borderRadius: '8px',
                            borderColor: 'rgba(71, 118, 230, 0.5)',
                            color: '#4776E6',
                            '&:hover': {
                                borderColor: '#4776E6',
                                backgroundColor: 'rgba(71, 118, 230, 0.08)'
                            }
                        }}
                    >
                        返回列表
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!wordbook) { // 如果没在加载也没错误，但 wordbook 为 null
        return (
            <Container maxWidth="sm" className="animate-fade-in">
                <Alert
                    severity="warning"
                    sx={{
                        mt: 4,
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(255, 152, 0, 0.15)'
                    }}
                >
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                        未找到单词书数据
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/wordbooks"
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            mt: 1,
                            borderRadius: '8px',
                            borderColor: 'rgba(71, 118, 230, 0.5)',
                            color: '#4776E6',
                            '&:hover': {
                                borderColor: '#4776E6',
                                backgroundColor: 'rgba(71, 118, 230, 0.08)'
                            }
                        }}
                    >
                        返回列表
                    </Button>
                </Alert>
            </Container>
        );
    }

    // 正常显示详情
    return (
        <Container maxWidth="lg" className="animate-fade-in">
            <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                <Button
                    component={RouterLink}
                    to="/wordbooks"
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        borderRadius: '8px',
                        color: '#4776E6',
                        '&:hover': {
                            backgroundColor: 'rgba(71, 118, 230, 0.08)'
                        }
                    }}
                >
                    返回我的单词书
                </Button>
            </Box>

            <Fade in={true} timeout={800}>
                <Paper
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        p: 4,
                        mb: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '16px'
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

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BookIcon
                            sx={{
                                fontSize: '2.5rem',
                                mr: 2,
                                color: '#4776E6'
                            }}
                        />
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 'bold',
                                background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            {wordbook.name}
                        </Typography>
                    </Box>

                    {wordbook.description && (
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            paragraph
                            sx={{ ml: 6, mb: 3 }}
                        >
                            {wordbook.description}
                        </Typography>
                    )}

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            ml: 6
                        }}
                    >
                        <Chip
                            label={`共 ${wordbook.words?.length || 0} 个单词`}
                            sx={{
                                borderRadius: '16px',
                                background: 'rgba(71, 118, 230, 0.1)',
                                color: '#4776E6',
                                fontWeight: 'medium'
                            }}
                        />
                        <Chip
                            label={`级别: ${wordbook.level || '未指定'}`}
                            sx={{
                                borderRadius: '16px',
                                background: 'rgba(142, 84, 233, 0.1)',
                                color: '#8E54E9',
                                fontWeight: 'medium'
                            }}
                        />
                        <Chip
                            label={`分类: ${wordbook.category || '未指定'}`}
                            sx={{
                                borderRadius: '16px',
                                background: 'rgba(76, 175, 80, 0.1)',
                                color: '#4CAF50',
                                fontWeight: 'medium'
                            }}
                        />
                        <Chip
                            label={`更新于: ${new Date(wordbook.updatedAt).toLocaleString()}`}
                            sx={{
                                borderRadius: '16px',
                                background: 'rgba(255, 152, 0, 0.1)',
                                color: '#FF9800',
                                fontWeight: 'medium'
                            }}
                        />
                    </Box>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/learn/${wordbookId}`)}
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
                            开始学习
                        </Button>
                    </Box>
                </Paper>
            </Fade>

            <Fade in={true} timeout={1000}>
                <Box>
                    <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            mb: 3
                        }}
                    >
                        <span
                            role="img"
                            aria-label="words"
                            style={{ marginRight: '8px' }}
                        >
                            📚
                        </span>
                        包含的单词
                    </Typography>

                    {wordbook.words && wordbook.words.length > 0 ? (
                        <Card
                            elevation={0}
                            className="card-neumorphic"
                            sx={{
                                borderRadius: '16px',
                                overflow: 'hidden'
                            }}
                        >
                            <List sx={{ p: 0 }}>
                                {wordbook.words.map((word, index) => (
                                    <Zoom
                                        in={true}
                                        style={{
                                            transitionDelay: `${index * 50}ms`,
                                        }}
                                        key={word._id}
                                    >
                                        <ListItem
                                            divider={index < wordbook.words.length - 1}
                                            sx={{
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(71, 118, 230, 0.05)'
                                                },
                                                py: 1.5
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 'bold',
                                                            color: '#4776E6'
                                                        }}
                                                    >
                                                        {word.spelling}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            component="span"
                                                            sx={{
                                                                color: '#8E54E9',
                                                                mr: 1,
                                                                display: 'inline-flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            [{word.phonetic || 'N/A'}]
                                                            <IconButton
                                                                size="small"
                                                                sx={{
                                                                    ml: 0.5,
                                                                    color: '#8E54E9',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(142, 84, 233, 0.1)'
                                                                    }
                                                                }}
                                                            >
                                                                <VolumeUpIcon fontSize="small" />
                                                            </IconButton>
                                                        </Typography>
                                                        <Typography variant="body2" component="span">
                                                            {word.meaning || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete word"
                                                    onClick={() => handleDeleteWordFromBook(word._id)}
                                                    sx={{
                                                        color: '#f44336',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </Zoom>
                                ))}
                            </List>
                        </Card>
                    ) : (
                        <Paper
                            elevation={0}
                            className="card-glass"
                            sx={{
                                p: 4,
                                borderRadius: '16px',
                                textAlign: 'center'
                            }}
                        >
                            <Typography
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 'medium'
                                }}
                            >
                                这本单词书还没有添加任何单词。
                            </Typography>
                            <Button
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                    borderRadius: '8px',
                                    borderColor: 'rgba(71, 118, 230, 0.5)',
                                    color: '#4776E6',
                                    '&:hover': {
                                        borderColor: '#4776E6',
                                        backgroundColor: 'rgba(71, 118, 230, 0.08)'
                                    }
                                }}
                                component={RouterLink}
                                to="/words"
                            >
                                去添加单词
                            </Button>
                        </Paper>
                    )}
                </Box>
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

export default WordbookDetailPage;