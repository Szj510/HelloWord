import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // 用于检查登录状态和获取 token (通过 apiFetch 自动使用)
import apiFetch from '../utils/api'; // 引入封装的 apiFetch
import { memoryColors, earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig'; // 引入记忆颜色和主题颜色系统配置
import { useTheme, COLOR_SCHEMES } from '../context/ThemeContext'; // 引入主题上下文

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
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

// 导入图标
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import TuneIcon from '@mui/icons-material/Tune';

// 辅助函数：将十六进制颜色转换为RGB格式
const hexToRgb = (hex) => {
  // 移除可能的#前缀
  hex = hex.replace('#', '');
  
  // 解析RGB值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

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

function WordsPage() {
  const { isAuthenticated } = useAuth(); // 检查用户是否登录，以启用"添加到单词本"功能
  const { theme, colorScheme } = useTheme(); // 获取当前主题和颜色方案
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
  
  // 新增视觉设置
  const [showPOSColoring, setShowPOSColoring] = useState(true); // 默认启用词性颜色
  const [showImportance, setShowImportance] = useState(false); // 单词重要性标记
  const [filterByPOS, setFilterByPOS] = useState('all'); // 词性过滤

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

  // 获取单词列表
  const fetchWords = useCallback(async (page = 1, search = '', pos = 'all') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 }); // 每页显示10个
      if (search) {
        params.append('search', search);
      }
      if (pos !== 'all') {
        params.append('pos', pos);
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
    fetchWords(currentPage, searchTerm, filterByPOS);
  }, [fetchWords, currentPage, searchTerm, filterByPOS]); // 依赖项改变时重新获取

  // 组件加载时获取用户单词书 (仅当用户已登录)
  useEffect(() => {
    fetchUserWordbooks();
  }, [fetchUserWordbooks]); // 依赖 fetchUserWordbooks (它内部依赖 isAuthenticated)

  // 处理搜索输入
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 处理搜索提交
  const handleSearchSubmit = () => {
    setCurrentPage(1); // 搜索时回到第一页
    fetchWords(1, searchTerm, filterByPOS);
  };

  // 处理分页变化
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchWords(value, searchTerm, filterByPOS); // 使用新的页码获取数据
    // 滚动到页面顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 处理单词书选择变化
  const handleWordbookChange = (event) => {
    setSelectedWordbookId(event.target.value);
  };

  // 处理词性过滤变化
  const handlePOSFilterChange = (pos) => {
    setFilterByPOS(pos);
    setCurrentPage(1);
    fetchWords(1, searchTerm, pos);
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

  // 获取单词重要性 (根据使用频率、难度等设定)
  const getWordImportance = (word) => {
    if (!word) return 0;
    
    // 这里可以根据单词属性设置不同重要性级别
    // 示例判断逻辑，实际应用中可根据特定属性或API返回值设置
    if (word.frequency && word.frequency < 1000) {
      return 2; // 高重要性
    } else if (word.frequency && word.frequency < 3000) {
      return 1; // 中重要性
    }
    return 0; // 标准重要性
  };

  // 处理添加单词到单词书
  const handleAddWord = async (wordId) => {
    if (!selectedWordbookId) {
      showSnackbar('请先选择一个单词书', 'warning');
      return;
    }
    if (!isAuthenticated) {
      showSnackbar('请先登录再添加单词', 'error');
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

  // 渲染单词拼写，根据重要性添加颜色
  const renderWordSpelling = (word) => {
    if (!showImportance) {
      return (
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: '500',
            fontSize: '1.1rem'
          }}
        >
          {word.spelling}
        </Typography>
      );
    }

    const importance = getWordImportance(word);
    let className;
    
    switch (importance) {
      case 2:
        className = 'importance-high';
        break;
      case 1:
        className = 'importance-medium';
        break;
      default:
        className = 'importance-standard';
    }

    return (
      <Typography 
        variant="h6" 
        component="div" 
        className={className}
        sx={{ 
          fontWeight: '500',
          fontSize: '1.1rem'
        }}
      >
        {word.spelling}
      </Typography>
    );
  };

  return (
    <Container maxWidth="md" className="animate-fade-in">
      <Typography 
        component="h1" 
        variant="h4" 
        gutterBottom 
        className="gradient-text"
        sx={{ 
          textAlign: 'center', 
          fontWeight: 'bold',
          my: 3
        }}
      >
        单词列表
      </Typography>

      {/* 搜索区域 - 升级为更现代的搜索框 */}
      <Paper
        component="form"
        elevation={0}
        className="card-glass"
        sx={{ 
          p: '2px 4px', 
          display: 'flex', 
          alignItems: 'center',
          borderRadius: '50px',
          mb: 2,
          transition: 'all 0.3s ease',
          backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 30, 30, 0.7)', // 根据主题使用不同背景色
          boxShadow: `0 8px 20px rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
          '&:hover': {
            boxShadow: `0 8px 20px rgba(${hexToRgb(themeColors.accent)}, 0.25)`
          }
        }}
      >
        <InputBase
          sx={{ 
            ml: 2, 
            flex: 1,
            color: theme === 'light' ? themeColors.text : '#F3E9DD' // 根据主题使用不同文本颜色
          }}
          placeholder="搜索单词"
          inputProps={{ 'aria-label': '搜索单词' }}
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
        />
        <IconButton 
          type="button" 
          sx={{ 
            p: '10px', 
            color: themeColors.accent // 使用当前主题的强调色
          }} 
          aria-label="search"
          onClick={handleSearchSubmit}
        >
          <SearchIcon />
        </IconButton>
      </Paper>

      {/* 新增：过滤和显示选项 */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 词性过滤 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: { xs: 2, md: 0 } }}>
          <Chip
            label="全部" 
            color={filterByPOS === 'all' ? 'primary' : 'default'}
            onClick={() => handlePOSFilterChange('all')}
            sx={{ 
              transition: 'all 0.3s ease',
              backgroundColor: filterByPOS === 'all' ? themeColors.accent : undefined,
              color: filterByPOS === 'all' ? '#fff' : undefined
            }}
          />
          <Chip 
            label="名词" 
            color={filterByPOS === 'n' ? 'primary' : 'default'}
            onClick={() => handlePOSFilterChange('n')}
            sx={{
              backgroundColor: filterByPOS === 'n' ? memoryColors.noun : undefined,
              color: filterByPOS === 'n' ? '#fff' : undefined,
              transition: 'all 0.3s ease'
            }}
          />
          <Chip 
            label="动词" 
            color={filterByPOS === 'v' ? 'primary' : 'default'}
            onClick={() => handlePOSFilterChange('v')}
            sx={{
              backgroundColor: filterByPOS === 'v' ? memoryColors.verb : undefined,
              color: filterByPOS === 'v' ? '#fff' : undefined,
              transition: 'all 0.3s ease'
            }}
          />
          <Chip 
            label="形容词" 
            color={filterByPOS === 'adj' ? 'primary' : 'default'}
            onClick={() => handlePOSFilterChange('adj')}
            sx={{
              backgroundColor: filterByPOS === 'adj' ? memoryColors.adj : undefined,
              color: filterByPOS === 'adj' ? '#fff' : undefined,
              transition: 'all 0.3s ease'
            }}
          />
          <Chip 
            label="副词" 
            color={filterByPOS === 'adv' ? 'primary' : 'default'}
            onClick={() => handlePOSFilterChange('adv')}
            sx={{
              backgroundColor: filterByPOS === 'adv' ? memoryColors.adv : undefined,
              color: filterByPOS === 'adv' ? '#fff' : undefined,
              transition: 'all 0.3s ease'
            }}
          />
        </Box>
        
        {/* 视觉选项 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormGroup row>
            <FormControlLabel 
              control={
                <Switch 
                  checked={showPOSColoring} 
                  onChange={(e) => setShowPOSColoring(e.target.checked)} 
                  color="primary"
                  size="small"
                />
              } 
              label="词性着色" 
              sx={{ mr: 2 }}
            />
            <FormControlLabel 
              control={
                <Switch 
                  checked={showImportance} 
                  onChange={(e) => setShowImportance(e.target.checked)} 
                  color="primary"
                  size="small"
                />
              } 
              label="重要性标记" 
            />
          </FormGroup>
        </Box>
      </Box>

      {/* 加载与错误提示 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginY: 4 }}>
          <div className="spinner" />
        </Box>
      )}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            marginBottom: 3,
            borderRadius: '12px',
            animation: 'fadeIn 0.5s ease-out',
            backgroundColor: 'rgba(248, 93, 93, 0.1)', 
            color: '#F85D5D'
          }}
        >
          {error}
        </Alert>
      )}

      {/* 单词列表 */}
      {!loading && !error && words.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center',
            p: 6, 
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            my: 4
          }}
          className="glass"
        >
          <Typography variant="h6" color="text.secondary">没有找到单词。</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>尝试其他搜索词或清空搜索条件。</Typography>
        </Box>
      )}
      
      <Fade in={!loading && words.length > 0}>
        <Box>
          {/* 添加到单词书选择器 (仅登录后显示) */}
          {isAuthenticated && userWordbooks.length > 0 && (
            <FormControl 
              fullWidth 
              sx={{ 
                marginBottom: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `rgba(${hexToRgb(themeColors.accent)}, 0.3)`
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `rgba(${hexToRgb(themeColors.accent)}, 0.5)`
                }
              }}
            >
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
            <Alert 
              severity="warning" 
              sx={{ 
                marginBottom: 3,
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(248, 195, 93, 0.15)',
                animation: 'fadeIn 0.5s ease-out'
              }}
            >
              你还没有创建任何单词书，请先创建。
            </Alert>
          )}

          <Box 
            sx={{ 
              borderRadius: '16px', 
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 10px 30px rgba(${hexToRgb(themeColors.accent)}, 0.15)`
              },
              // 直接使用themeColors中的light颜色作为背景色
              backgroundColor: themeColors.light,
              // 添加!important确保样式不被MUI的默认样式覆盖
              '& .MuiList-root': {
                backgroundColor: `${themeColors.light} !important`,
              }
            }}
            className="card-neumorphic"
            component={Paper} // 显式指定为Paper组件
            elevation={0} // 设置elevation为0，这样会使用我们在themeConfig中为elevation0设置的样式
          >
            <List>
              {words.map((word, index) => {
                const statusInfo = addWordStatus[word._id] || {};
                const isAdding = statusInfo.status === 'loading';
                const isSuccess = statusInfo.status === 'success';
                const hasError = statusInfo.status === 'error';

                return (
                  <Zoom 
                    in={true} 
                    style={{ 
                      transitionDelay: `${index * 50}ms`,
                    }}
                    key={word._id}
                  >
                    <ListItem
                      sx={{ 
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.2)',
                        },
                        py: 1.5
                      }}
                      secondaryAction={
                        isAuthenticated && ( // 只有登录用户才能看到添加按钮
                          <Button
                            variant={isSuccess ? "contained" : "outlined"}
                            size="small"
                            onClick={() => handleAddWord(word._id)}
                            disabled={isAdding || isSuccess} // 正在添加或已成功时禁用
                            sx={{
                              borderRadius: '20px',
                              minWidth: '80px',
                              transition: 'all 0.3s ease',
                              ...(isSuccess ? {
                                background: '#32CD32',
                                boxShadow: '0 4px 10px rgba(50, 205, 50, 0.3)',
                                '&:hover': {
                                  boxShadow: '0 6px 15px rgba(50, 205, 50, 0.4)',
                                }
                              } : {
                                borderColor: themeColors.accent,
                                color: themeColors.accent,
                                '&:hover': {
                                  borderColor: themeColors.secondary,
                                  backgroundColor: `rgba(${hexToRgb(themeColors.accent)}, 0.08)`,
                                  transform: 'translateY(-2px)'
                                }
                              })
                            }}
                            startIcon={isAdding ? null : (isSuccess ? null : <AddIcon />)}
                          >
                            {isAdding ? <div className="spinner" style={{ width: 20, height: 20 }} /> : (isSuccess ? '已添加' : '添加')}
                          </Button>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            {renderWordSpelling(word)}
                            {/* 词性标签 */}
                            {renderPOSTag(word.partOfSpeech)}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography 
                              variant="body2" 
                              component="span" 
                              sx={{ 
                                display: 'block',
                                color: theme === 'light' ? themeColors.secondaryText : themeColors.border, 
                                fontStyle: 'italic' 
                              }}
                            >
                              {word.phonetic && `[${word.phonetic}]`}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              component="span" 
                              className={showImportance ? (word.partOfSpeech?.toLowerCase().includes('v') ? 'translation-text' : undefined) : undefined}
                              sx={{ 
                                display: 'block',
                                mt: 0.5,
                                color: theme === 'light' ? themeColors.text : themeColors.light
                              }}
                            >
                              {word.meaning}
                            </Typography>
                            {hasError && (
                              <Typography 
                                variant="caption" 
                                color="error" 
                                sx={{
                                  display: 'block',
                                  mt: 1,
                                  animation: 'fadeIn 0.3s ease-out'
                                }}
                              >
                                添加失败: {statusInfo.message}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </Zoom>
                );
              })}
            </List>
          </Box>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '1rem',
                    mx: 0.5,
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      background: themeColors.accent,
                      color: '#fff',
                      fontWeight: 'bold',
                      boxShadow: `0 4px 10px rgba(${hexToRgb(themeColors.accent)}, 0.3)`,
                      '&:hover': {
                        opacity: 0.9,
                      }
                    },
                    '&:hover': {
                      backgroundColor: `rgba(${hexToRgb(themeColors.accent)}, 0.1)`,
                      transform: 'translateY(-2px)'
                    }
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Fade>
      
      {/* Snackbar 用于全局提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Alert 作为 Snackbar 的内容，可以显示不同严重性 */}
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            backgroundColor: snackbarSeverity === 'success' 
              ? '#32CD32' 
              : snackbarSeverity === 'error'
                ? '#F85D5D'
                : snackbarSeverity === 'warning'
                  ? '#F8C35D'
                  : '#4BA4F9'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default WordsPage;