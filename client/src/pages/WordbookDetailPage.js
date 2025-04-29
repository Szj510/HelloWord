import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext'; // 检查登录
import { memoryColors, earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig'; // 引入所有配色方案
import { useTheme } from '../context/ThemeContext'; // 引入主题上下文

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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Pagination from '@mui/material/Pagination'; // 添加分页组件

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookIcon from '@mui/icons-material/Book';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TuneIcon from '@mui/icons-material/Tune';
import FilterListIcon from '@mui/icons-material/FilterList';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';

// 词性颜色辅助函数
const getPOSColor = (pos) => {
    if (!pos) return null;
    
    const posLower = pos.toLowerCase().trim();
    
    if (posLower.includes('n') || posLower === 'noun') {
        return memoryColors.noun;
    } else if (posLower.includes('v') || posLower === 'verb') {
        return memoryColors.verb;
    } else if (posLower.includes('adj') || posLower === 'adjective') {
        return memoryColors.adj;
    } else if (posLower.includes('adv') || posLower === 'adverb') {
        return memoryColors.adv;
    } else if (posLower.includes('prep') || posLower === 'preposition') {
        return memoryColors.prep;
    } else if (posLower.includes('conj') || posLower === 'conjunction') {
        return memoryColors.conj;
    }
    
    return null;
};

// 获取当前主题配色方案的辅助函数
const getThemeColors = (colorScheme) => {
    switch (colorScheme) {
        case 'blue-gray':
            return blueGrayColors;
        case 'green-beige':
            return greenBeigeColors;
        case 'earth-tone':
        default:
            return earthToneColors;
    }
};

function WordbookDetailPage() {
    const { id: wordbookId } = useParams(); // 从 URL 获取单词书 ID
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { colorScheme } = useTheme(); // 获取当前颜色方案
    
    // 获取当前主题的颜色
    const themeColors = getThemeColors(colorScheme);

    const [wordbook, setWordbook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 分页状态
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalWords, setTotalWords] = useState(0);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    
    // 视觉设置
    const [showPOSColoring, setShowPOSColoring] = useState(true); // 默认启用词性颜色
    const [showImportance, setShowImportance] = useState(false); // 单词重要性标记
    const [filterByPOS, setFilterByPOS] = useState('all'); // 词性过滤

    // 获取单词书详情的函数 (修改为支持分页)
    const fetchWordbookDetail = useCallback(async (currentPage = 1) => {
        setLoading(true);
        setError('');
        try {
            // 添加分页参数
            const data = await apiFetch(`/api/wordbooks/${wordbookId}?page=${currentPage}&limit=${pageSize}`);
            setWordbook(data);
            // 设置分页信息
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
                setTotalWords(data.pagination.total);
            }
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
    }, [wordbookId, pageSize]); // 依赖 wordbookId 和 pageSize

    // 处理页码变化
    const handlePageChange = (event, newPage) => {
        setPage(newPage);
        fetchWordbookDetail(newPage);
        // 滚动到页面顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // 组件加载时获取数据
    useEffect(() => {
        if (isAuthenticated) { // 确认登录才获取
             fetchWordbookDetail(page);
        } else {
            setError("请先登录。");
            setLoading(false);
        }
    }, [isAuthenticated, fetchWordbookDetail, page]); // 依赖认证状态、获取函数和页码

    // 从单词书中删除单词
    const handleDeleteWordFromBook = async (wordIdToRemove) => {
       // 添加确认框
       if (!window.confirm(`确定要从《${wordbook?.name || '此单词书'}》中移除这个单词吗？`)) {
           return;
       }

       try {
         const response = await apiFetch(`/api/wordbooks/${wordbookId}/words/${wordIdToRemove}`, { method: 'DELETE' });
         showSnackbar(response.msg || '单词移除成功！', 'success');
         // 删除成功后刷新单词列表
         fetchWordbookDetail(page); // 重新获取单词书详情
       } catch (err) {
         console.error(`移除单词 ${wordIdToRemove} 失败:`, err);
         showSnackbar(`移除失败: ${err.message}`, 'error');
       }
    };

    // 处理词性过滤变化
    const handlePOSFilterChange = (newPos) => {
        setFilterByPOS(newPos);
    };

    // 渲染词性标签
    const renderPOSTag = (pos) => {
        if (!pos || !showPOSColoring) return null;
        
        const color = getPOSColor(pos);
        return (
        <Chip 
            label={pos}
            size="small"
            sx={{
            ml: 1,
            color: '#fff',
            fontWeight: 600,
            backgroundColor: color,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        />
        );
    };

    // 获得筛选后的单词列表
    const getFilteredWords = () => {
        if (!wordbook?.words || !Array.isArray(wordbook.words)) return [];
        if (filterByPOS === 'all') return wordbook.words;
        
        return wordbook.words.filter(word => {
            if (!word.partOfSpeech) return false;
            const pos = word.partOfSpeech.toLowerCase();
            return pos.includes(filterByPOS.toLowerCase());
        });
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

    const filteredWords = getFilteredWords();

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
                        color: themeColors.accent,
                        '&:hover': {
                            backgroundColor: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.08)`
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
                        borderRadius: '16px',
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
                            background: themeColors.gradient,
                            opacity: 0.7
                        }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BookIcon
                            sx={{
                                fontSize: '2.5rem',
                                mr: 2,
                                color: themeColors.accent
                            }}
                        />
                        <Typography
                            variant="h4"
                            className="gradient-text"
                            sx={{
                                fontWeight: 'bold'
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
                            label={`共 ${totalWords || 0} 个单词`}
                            sx={{
                                borderRadius: '16px',
                                background: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.1)`,
                                color: themeColors.accent,
                                fontWeight: 'medium'
                            }}
                        />
                        <Chip
                            label={`级别: ${wordbook.level || '未指定'}`}
                            sx={{
                                borderRadius: '16px',
                                background: `rgba(${parseInt(themeColors.secondary.slice(1,3), 16)}, ${parseInt(themeColors.secondary.slice(3,5), 16)}, ${parseInt(themeColors.secondary.slice(5,7), 16)}, 0.1)`,
                                color: themeColors.secondary,
                                fontWeight: 'medium'
                            }}
                        />
                        <Chip
                            label={`分类: ${wordbook.category || '未指定'}`}
                            sx={{
                                borderRadius: '16px',
                                background: `rgba(${parseInt(themeColors.tertiary.slice(1,3), 16)}, ${parseInt(themeColors.tertiary.slice(3,5), 16)}, ${parseInt(themeColors.tertiary.slice(5,7), 16)}, 0.1)`,
                                color: themeColors.tertiary,
                                fontWeight: 'medium'
                            }}
                        />
                        <Chip
                            label={`更新于: ${new Date(wordbook.updatedAt).toLocaleString()}`}
                            sx={{
                                borderRadius: '16px',
                                background: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.06)`,
                                color: themeColors.secondaryText,
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
                                background: themeColors.gradient,
                                boxShadow: themeColors.boxShadow,
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `0 12px 20px rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.4)`,
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
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        mb: 3
                    }}>
                        <Typography
                            variant="h5"
                            className="gradient-text"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                mb: { xs: 2, md: 0 }
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

                        {/* 词性过滤和视觉设置选项 */}
                        <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center', 
                            gap: 2,
                            p: 2,
                            mb: 2,
                            borderRadius: '12px',
                            backgroundColor: `${themeColors.light} !important`, // 确保背景色不被MUI默认样式覆盖
                        }} className="card-neumorphic" component={Paper}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label="全部词性" 
                                    color={filterByPOS === 'all' ? 'primary' : 'default'}
                                    onClick={() => handlePOSFilterChange('all')}
                                    size="small"
                                    sx={{ transition: 'all 0.3s ease' }}
                                />
                                <Chip 
                                    label="名词" 
                                    color={filterByPOS === 'n' ? 'primary' : 'default'}
                                    onClick={() => handlePOSFilterChange('n')}
                                    size="small"
                                    sx={{
                                        backgroundColor: filterByPOS === 'n' ? memoryColors.noun : undefined,
                                        color: filterByPOS === 'n' ? '#fff' : undefined
                                    }}
                                />
                                <Chip 
                                    label="动词" 
                                    color={filterByPOS === 'v' ? 'primary' : 'default'}
                                    onClick={() => handlePOSFilterChange('v')}
                                    size="small"
                                    sx={{
                                        backgroundColor: filterByPOS === 'v' ? memoryColors.verb : undefined,
                                        color: filterByPOS === 'v' ? '#fff' : undefined
                                    }}
                                />
                                <Chip 
                                    label="形容词" 
                                    color={filterByPOS === 'adj' ? 'primary' : 'default'}
                                    onClick={() => handlePOSFilterChange('adj')}
                                    size="small"
                                    sx={{
                                        backgroundColor: filterByPOS === 'adj' ? memoryColors.adj : undefined,
                                        color: filterByPOS === 'adj' ? '#fff' : undefined
                                    }}
                                />
                            </Box>

                            <FormControlLabel 
                                control={
                                    <Switch 
                                        checked={showPOSColoring} 
                                        onChange={(e) => setShowPOSColoring(e.target.checked)} 
                                        size="small"
                                    />
                                } 
                                label="词性着色" 
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    </Box>

                    {filteredWords.length > 0 ? (
                        <React.Fragment>
                            <Card
                                elevation={0}
                                className="card-neumorphic"
                                sx={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    backgroundColor: `${themeColors.light} !important` // 确保背景色不被MUI默认样式覆盖
                                }}
                                component={Paper} // 显式指定为Paper组件
                            >
                                <List sx={{ p: 0 }}>
                                    {filteredWords.map((word, index) => (
                                        <Zoom
                                            in={true}
                                            style={{
                                                transitionDelay: `${index * 50}ms`,
                                            }}
                                            key={word._id}
                                        >
                                            <ListItem
                                                divider={index < filteredWords.length - 1}
                                                sx={{
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        backgroundColor: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.05)`
                                                    },
                                                    py: 1.5
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{
                                                                    fontWeight: 'bold',
                                                                    color: themeColors.accent
                                                                }}
                                                            >
                                                                {word.spelling}
                                                            </Typography>
                                                            {/* 词性标签 */}
                                                            {renderPOSTag(word.partOfSpeech)}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ mt: 0.5 }}>
                                                            <Typography
                                                                variant="body2"
                                                                component="span"
                                                                sx={{
                                                                    color: themeColors.secondary,
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
                                                                        color: themeColors.secondary,
                                                                        '&:hover': {
                                                                            backgroundColor: `rgba(${parseInt(themeColors.secondary.slice(1,3), 16)}, ${parseInt(themeColors.secondary.slice(3,5), 16)}, ${parseInt(themeColors.secondary.slice(5,7), 16)}, 0.1)`
                                                                        }
                                                                    }}
                                                                >
                                                                    <VolumeUpIcon fontSize="small" />
                                                                </IconButton>
                                                            </Typography>
                                                            <Typography 
                                                                variant="body2" 
                                                                component="span"
                                                                className={
                                                                    showPOSColoring && word.partOfSpeech?.toLowerCase().includes('v') 
                                                                    ? 'translation-text' : undefined
                                                                }
                                                            >
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
                                                            color: '#f44336',  // 删除按钮保持红色警示色
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

                            {/* 分页控件 */}
                            {totalPages > 1 && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    mt: 3,
                                    mb: 3 
                                }}>
                                    <Pagination 
                                        count={totalPages} 
                                        page={page} 
                                        onChange={handlePageChange} 
                                        color="primary" 
                                        size="large"
                                        showFirstButton
                                        showLastButton
                                        sx={{
                                            '& .MuiPaginationItem-root': {
                                                fontSize: '1rem',
                                                borderRadius: '8px',
                                                minWidth: '40px',
                                                height: '40px',
                                                margin: '0 4px',
                                                transition: 'all 0.3s ease',
                                            },
                                            '& .Mui-selected': {
                                                background: themeColors.gradient,
                                                boxShadow: themeColors.boxShadow,
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: themeColors.accent,
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </React.Fragment>
                    ) : wordbook.words && wordbook.words.length > 0 ? (
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
                                没有找到符合当前过滤条件的单词。
                            </Typography>
                            <Button
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                    borderRadius: '8px',
                                    borderColor: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.5)`,
                                    color: themeColors.accent,
                                    '&:hover': {
                                        borderColor: themeColors.accent,
                                        backgroundColor: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.08)`
                                    }
                                }}
                                onClick={() => setFilterByPOS('all')}
                            >
                                查看所有单词
                            </Button>
                        </Paper>
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
                                    borderColor: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.5)`,
                                    color: themeColors.accent,
                                    '&:hover': {
                                        borderColor: themeColors.accent,
                                        backgroundColor: `rgba(${parseInt(themeColors.accent.slice(1,3), 16)}, ${parseInt(themeColors.accent.slice(3,5), 16)}, ${parseInt(themeColors.accent.slice(5,7), 16)}, 0.08)`
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