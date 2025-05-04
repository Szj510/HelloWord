import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { memoryColors, getActiveTheme } from '../theme/themeConfig';
import { useTheme as useMuiTheme } from '@mui/material/styles';

// MUI 组件
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack'; // 用于排列按钮
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip'; 
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton'; // 用于发音按钮
import StarBorderIcon from '@mui/icons-material/StarBorder'; // 空星
import StarIcon from '@mui/icons-material/Star'; // 实心星
import Snackbar from '@mui/material/Snackbar'; 
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import VolumeUpIcon from '@mui/icons-material/VolumeUp'; // 发音图标
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // 正确图标
import CancelIcon from '@mui/icons-material/Cancel'; // 错误图标
import Grow from '@mui/material/Grow'; // 添加Grow动画效果
import SettingsIcon from '@mui/icons-material/Settings';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import SchoolIcon from '@mui/icons-material/School';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// 新增：词性颜色显示功能
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

// 获取记忆层级对应的颜色
const getMemoryLevelColor = (level) => {
    if (!level && level !== 0) return memoryColors.memoryLevel1;
    
    // 假设记忆层级从0到4
    switch (Math.min(Math.max(0, level), 4)) {
        case 0: return memoryColors.memoryLevel1;
        case 1: return memoryColors.memoryLevel2;
        case 2: return memoryColors.memoryLevel3;
        case 3: return memoryColors.memoryLevel4;
        case 4: return memoryColors.memoryLevel5;
        default: return memoryColors.memoryLevel1;
    }
};

// 根据重要性获取颜色
const getImportanceColor = (importance) => {
    if (!importance && importance !== 0) return null;
    
    // 假设重要性从0到2，0最低，2最高
    switch (Math.min(Math.max(0, importance), 2)) {
        case 0: return memoryColors.subColor;
        case 1: return memoryColors.mainColor;
        case 2: return memoryColors.importantTerm;
        default: return null;
    }
};

// 辅助函数：根据状态返回 Chip 的颜色
const getStatusColor = (status) => {
    switch (status) {
        case 'New': return 'default'; // 或者 'secondary'
        case 'Learning': return 'info';
        case 'Reviewing': return 'warning';
        case 'Mastered': return 'success';
        default: return 'default';
    }
};

function LearningPage() {
  const { wordbookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth(); // 移除未使用的user变量
  const { colorScheme } = useAppTheme(); // 获取当前颜色方案
  const themeColors = getActiveTheme(colorScheme).palette.colorScheme; // 获取当前主题的配色
  const muiTheme = useMuiTheme(); // 获取MUI主题对象
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') || 'flashcard'; // 默认为 flashcard
  const initialNewLimit = queryParams.get('newLimit');       // 可以从 URL 传递限制
  const initialReviewLimit = queryParams.get('reviewLimit');
    
  const [sessionTitle, setSessionTitle] = useState('学习会话'); // 通用标题
  const [wordsToLearn, setWordsToLearn] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 用于记录交互 API 调用
  const [isRevealed, setIsRevealed] = useState(false);
  const [learningMode, setLearningMode] = useState(initialMode); 
  const [spellingInput, setSpellingInput] = useState(''); // 拼写模式下的用户输入
  const [feedback, setFeedback] = useState({ show: false, correct: false, message: '' }); // 拼写反馈
  const spellingInputRef = useRef(null); // 用于聚焦输入框
  
  const [notebookWordIds, setNotebookWordIds] = useState(new Set()); // 存储生词本中单词 ID 的 Set
  const [loadingNotebookStatus, setLoadingNotebookStatus] = useState(true); // 加载生词本状态
  const [playingAudio, setPlayingAudio] = useState(false); // 控制发音按钮状态
    
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // 新增：会话信息
  const [sessionInfo, setSessionInfo] = useState({
    mode: 'mixed',
    newLimit: 0,
    reviewLimit: 0,
    actualNewCount: 0,
    actualReviewCount: 0,
    totalCount: 0
  });
  
  // 新增：设置菜单状态
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const settingsOpen = Boolean(settingsAnchorEl);
  
  // 新增：学习模式设置
  const [focusMode, setFocusMode] = useState(true); // 默认开启专注记忆模式
  const [showPOS, setShowPOS] = useState(true); // 默认显示词性
  const [memoryLevelVis, setMemoryLevelVis] = useState(true); // 默认开启记忆层级可视化
  
  // Snackbar functions
  const showSnackbar = (message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); };
  const handleSnackbarClose = (event, reason) => { if (reason === 'clickaway') { return; } setSnackbarOpen(false); };
  
  // 新增：设置菜单处理函数
  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  // 获取会话数据并设置标题
  const fetchLearningSession = useCallback(async () => {
      setLoading(true);
      setError('');
      setWordsToLearn([]); // 清空旧数据
      try {
          // 从location.state中获取模式和限制参数
          const mode = location.state?.mode || 'new'; // 默认为新词模式
          
          // 优先从location.state中获取限制参数，这样可以保证与主页传递的计划参数一致
          const newLimit = location.state?.newLimit || initialNewLimit;
          const reviewLimit = location.state?.reviewLimit || initialReviewLimit;
          
          console.log(`准备获取学习会话，模式：${mode}，新词限制：${newLimit}，复习词限制：${reviewLimit}`);
          
          // 添加mode参数到API请求中
          const params = new URLSearchParams({ 
              wordbookId,
              mode // 关键修改：将mode参数传递给API，确保只获取指定类型的单词
          });
          
          if (newLimit) params.append('newLimit', newLimit);
          if (reviewLimit) params.append('reviewLimit', reviewLimit);

          const data = await apiFetch(`/api/learning/session?${params.toString()}`);
          
          // 检查API返回的数据结构
          if (data && data.sessionWords && Array.isArray(data.sessionWords)) {
              console.log(`获取到会话单词数量：${data.sessionWords.length || 0}`);
              console.log(`会话信息：`, data.sessionInfo || '无会话信息');
              
              // 保存会话信息
              if (data.sessionInfo) {
                setSessionInfo(data.sessionInfo);
              }
              
              if (data.sessionWords.length === 0) {
                  setSessionTitle("任务完成"); // 更新标题
              } else {
                  // 设置单词学习列表
                  setWordsToLearn(data.sessionWords);
                  setCurrentWordIndex(0);
                  setIsRevealed(false);
                  setFeedback({ show: false, correct: false, message: '' });
                  setSpellingInput('');
                  
                  // 更新会话标题
                  if (data.sessionInfo && data.sessionInfo.mode) {
                      switch (data.sessionInfo.mode) {
                          case 'review':
                              setSessionTitle('复习单词');
                              break;
                          case 'new':
                              setSessionTitle('学习新单词');
                              break;
                          default:
                              setSessionTitle('学习会话');
                      }
                  } else {
                      // 根据模式设置不同标题
                      setSessionTitle(mode === 'review' ? '复习单词' : '学习新单词'); 
                  }
                  
                  if (learningMode === 'spelling') {
                      setTimeout(() => spellingInputRef.current?.focus(), 0);
                  }
              }
          } else {
              throw new Error("无效的会话数据格式");
          }
      } catch (err) {
          setError(`加载学习会话失败: ${err.message}`);
      } finally {
          setLoading(false);
      }
  }, [wordbookId, initialNewLimit, initialReviewLimit, learningMode, location.state]);

  const fetchNotebookIds = useCallback(async () => {
      if (!isAuthenticated) { setLoadingNotebookStatus(false); return; }
      setLoadingNotebookStatus(true);
      try {
          const data = await apiFetch('/api/notebook/entries?fields=wordId');
          setNotebookWordIds(new Set(data?.wordIds || [])); // 更新 Set
      } catch (err) {
          console.error("获取生词本 ID 失败:", err);
      } finally {
          setLoadingNotebookStatus(false);
      }
  }, [isAuthenticated]);

  useEffect(() => {
      fetchLearningSession(); // 获取会话单词
      fetchNotebookIds();   // 同时获取生词本 ID
  }, [fetchLearningSession, fetchNotebookIds]);

  const currentWord = wordsToLearn.length > 0 ? wordsToLearn[currentWordIndex] : null;

  const isWordInNotebook = currentWord ? notebookWordIds.has(currentWord._id.toString()) : false;
  
  // 修复闪卡模式点击事件
  const handleCardClick = () => {
      if (learningMode === 'flashcard') {
          console.log("卡片被点击，当前显示状态:", isRevealed, "切换为:", !isRevealed);
          setIsRevealed(!isRevealed);
      }
  };

  const handleToggleNotebook = async () => {
      if (!currentWord || isSubmitting || loadingNotebookStatus) return;

      const wordId = currentWord._id;
      const inNotebook = isWordInNotebook;

      const optimisticNewSet = new Set(notebookWordIds);
      if (inNotebook) {
          optimisticNewSet.delete(wordId.toString());
      } else {
          optimisticNewSet.add(wordId.toString());
      }
      setNotebookWordIds(optimisticNewSet);

      try {
          if (inNotebook) {
              await apiFetch(`/api/notebook/entries/${wordId}`, { method: 'DELETE' });
              showSnackbar(`"${currentWord.spelling}" 已从生词本移除`, 'info');
          } else {
              await apiFetch('/api/notebook/entries', {
                  method: 'POST',
                  body: JSON.stringify({ wordId: wordId, wordbookId: wordbookId })
              });
              showSnackbar(`"${currentWord.spelling}" 已添加到生词本`, 'success');
          }
      } catch (err) {
          showSnackbar(`操作失败: ${err.message}`, 'error');
          setNotebookWordIds(notebookWordIds);
      }
  };

  const handleModeChange = (event, newMode) => {
      if (newMode !== null) {
          setLearningMode(newMode);
          setIsRevealed(false);
          setSpellingInput('');
          setFeedback({ show: false, correct: false, message: '' });
          setError('');
          if (newMode === 'spelling') {
              setTimeout(() => spellingInputRef.current?.focus(), 0);
          }
      }
  };

  const handleCheckSpelling = () => {
      if (!currentWord || isSubmitting) return;

      const isCorrect = spellingInput.trim().toLowerCase() === currentWord.spelling.toLowerCase();

      setFeedback({ show: true, correct: isCorrect, message: isCorrect ? '正确!' : `正确答案: ${currentWord.spelling}` });

      setIsSubmitting(true);
      setTimeout(() => {
          recordAndProceed(isCorrect ? 'know' : 'dont_know');
      }, isCorrect ? 800 : 1500);
  };

  const handleSpellingKeyPress = (event) => {
      if (event.key === 'Enter' && !feedback.show) {
          handleCheckSpelling();
      }
  };

  const playAudio = async () => {
      if (!currentWord || playingAudio) return;
      
      setPlayingAudio(true);
      
      try {
          showSnackbar("正在获取发音...", "info");
          
          const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(currentWord.spelling)}`);
          
          if (!response.ok) throw new Error("API请求失败");
          
          const data = await response.json();
          
          let audioUrl = null;
          if (data && data.length > 0 && data[0].phonetics) {
              const usAudio = data[0].phonetics.find(p => 
                  p.audio && p.audio.length > 0 && (p.locale === 'us' || p.audio.includes('us'))
              );
              const anyAudio = data[0].phonetics.find(p => p.audio && p.audio.length > 0);
              
              audioUrl = usAudio?.audio || anyAudio?.audio;
          }
          
          if (audioUrl) {
              const audio = new Audio(audioUrl);
              audio.onerror = () => {
                  throw new Error("音频加载失败");
              };
              await audio.play();
              showSnackbar("正在播放发音", "success");
              
              audio.onended = () => setPlayingAudio(false);
              return;
          } else {
              throw new Error("未找到发音音频");
          }
      } catch (err) {
          fallbackSpeech();
      }
  };
  
  const fallbackSpeech = () => {
      if (currentWord && 'speechSynthesis' in window) {
          try {
              const utterance = new SpeechSynthesisUtterance(currentWord.spelling);
              utterance.lang = 'en-US';
              utterance.rate = 0.8;
              
              utterance.onend = () => setPlayingAudio(false);
              utterance.onerror = () => setPlayingAudio(false);
              
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(utterance);
              showSnackbar("使用本地合成播放发音", "info");
          } catch (e) {
              showSnackbar("无法播放发音", "error");
              setPlayingAudio(false);
          }
      } else {
          showSnackbar("浏览器不支持语音合成", "error");
          setPlayingAudio(false);
      }
  };

  // 修改goToNextWord函数，在完成所有单词学习后触发自定义事件
  const goToNextWord = () => {
      if (currentWordIndex < wordsToLearn.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setIsRevealed(false);
          setSpellingInput('');
          setFeedback({ show: false, correct: false, message: '' });
          setError('');
          if (learningMode === 'spelling') {
              setTimeout(() => spellingInputRef.current?.focus(), 0);
          }
      } else {
          // 当学习完成时，触发自定义事件通知首页更新待复习单词数量
          window.dispatchEvent(new Event('learning-complete'));
          console.log("已触发学习完成事件，通知首页更新待复习数量");
          
          navigate('/wordbooks', { state: { completionMessage: "恭喜！您已完成本轮学习！" } });
      }
  };

  const recordAndProceed = async (action) => {
      if (!currentWord || isSubmitting) return;
      setIsSubmitting(true); setError('');
      try {
          await apiFetch('/api/learning/record', {
              method: 'POST',
              body: JSON.stringify({ wordId: currentWord._id, action: action })
          });
          goToNextWord();
      } catch (err) { setError(`记录学习数据时出错: ${err.message}`); }
      finally { setIsSubmitting(false); }
  };
  
  const progressPercentage = wordsToLearn.length > 0 
      ? Math.round(((currentWordIndex) / wordsToLearn.length) * 100) 
      : 0;
  
  // 加载状态
  if (loading) {
      return (
          <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
              <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '60vh'
              }}>
                  <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                      正在准备您的学习会话...
                  </Typography>
                  <CircularProgress />
              </Box>
          </Container>
      );
  }
  
  // 错误状态
  if (error) {
      return (
          <Container maxWidth="sm">
              <Paper 
                  elevation={0} 
                  className="card-glass"
                  sx={{ 
                      mt: 4, 
                      p: 3, 
                      borderRadius: '16px',
                      textAlign: 'center'
                  }}
              >
                  <Alert 
                      severity="error" 
                      sx={{ mb: 3 }}
                      variant="outlined"
                  >
                      {error}
                  </Alert>
                  <Button 
                      variant="contained" 
                      onClick={() => navigate('/wordbooks')}
                      sx={{
                          background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                          borderRadius: '30px',
                          px: 4,
                          py: 1.2
                      }}
                  >
                      返回单词书列表
                  </Button>
              </Paper>
          </Container>
      );
  }
  
  // 无单词状态
  if (!currentWord && !loading && !error) {
      return (
          <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
              <Grow in={true} timeout={800}>
                  <Paper 
                      elevation={0} 
                      className="card-glass"
                      sx={{ 
                          p: 4, 
                          borderRadius: '16px',
                          textAlign: 'center'
                      }}
                  >
                      <Box sx={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.2))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2
                      }}>
                          <CheckCircleIcon fontSize="large" sx={{ color: '#4CAF50' }} />
                      </Box>
                      <Typography variant="h5" gutterBottom className="gradient-text" sx={{ fontWeight: 'bold' }}>
                          {sessionTitle}
                      </Typography>
                      <Typography sx={{ mb: 3, color: 'text.secondary' }}>
                          当前没有需要学习或复习的单词了！
                      </Typography>
                      <Button 
                          variant="contained" 
                          onClick={() => navigate('/wordbooks')}
                          sx={{
                              background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                              borderRadius: '30px',
                              px: 4,
                              py: 1.5,
                              fontWeight: 'bold',
                              boxShadow: '0 4px 15px rgba(71, 118, 230, 0.3)',
                              '&:hover': {
                                  transform: 'translateY(-3px)',
                                  boxShadow: '0 8px 25px rgba(71, 118, 230, 0.5)',
                              },
                          }}
                      >
                          返回我的单词书
                      </Button>
                  </Paper>
              </Grow>
          </Container>
      );
  }

  // 渲染词性标签
  const renderPOS = (pos) => {
    if (!showPOS || !pos) return null;
    
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

  // 获取当前单词的记忆层级
  const getWordMemoryLevel = () => {
    // 这里假设从单词数据中获取记忆层级信息
    // 如果您的数据结构中有这个字段，请替换为实际的字段名
    return currentWord?.memoryLevel || 0;
  };

  return (
      <Container maxWidth="sm" className="animate-fade-in">
          <Box sx={{ mt: 4, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, px: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                          进度: {currentWordIndex + 1} / {wordsToLearn.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                          {progressPercentage}%
                      </Typography>
                  </Box>
                  <LinearProgress 
                      variant="determinate" 
                      value={progressPercentage} 
                      sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(71, 118, 230, 0.1)',
                          '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: themeColors.gradient,
                          }
                      }}
                  />
              </Box>
              
              {/* 学习进度指示器 */}
              <Box sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  left: 16, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  zIndex: 3
              }}>
                  <Tooltip title="今日学习计划" arrow placement="right">
                      <Chip
                          icon={<SchoolIcon fontSize="small" />}
                          label={`${sessionInfo?.completedCount || 0}/${sessionInfo?.totalWords || 0}`}
                          size="small"
                          color="primary"
                          variant={(muiTheme?.palette?.mode || 'light') === 'dark' ? 'outlined' : 'filled'}
                          sx={{ 
                              fontWeight: 500,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              '& .MuiChip-icon': {
                                  color: 'inherit'
                              }
                          }}
                      />
                  </Tooltip>
                  <Tooltip title="新词/复习词" arrow placement="right">
                      <Chip
                          icon={<AutorenewIcon fontSize="small" />}
                          label={`${sessionInfo?.newWordsCount || 0}/${sessionInfo?.reviewWordsCount || 0}`}
                          size="small"
                          color="secondary"
                          variant={(muiTheme?.palette?.mode || 'light') === 'dark' ? 'outlined' : 'filled'}
                          sx={{ 
                              fontWeight: 500,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              '& .MuiChip-icon': {
                                  color: 'inherit'
                              }
                          }}
                      />
                  </Tooltip>
              </Box>
              
              {/* 设置按钮 */}
              <IconButton 
                onClick={handleSettingsClick}
              >
                <SettingsIcon />
              </IconButton>
              
              {/* 设置菜单 */}
              <Menu
                anchorEl={settingsAnchorEl}
                open={settingsOpen}
                onClose={handleSettingsClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    minWidth: 200
                  }
                }}
              >
                <MenuItem onClick={() => setFocusMode(!focusMode)}>
                  <FormControlLabel
                    control={<Switch checked={focusMode} color="primary" />}
                    label="专注记忆模式"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ width: '100%' }}
                  />
                </MenuItem>
                
                <MenuItem onClick={() => setShowPOS(!showPOS)}>
                  <FormControlLabel
                    control={<Switch checked={showPOS} color="primary" />}
                    label="显示词性标签"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ width: '100%' }}
                  />
                </MenuItem>
                
                <MenuItem onClick={() => setMemoryLevelVis(!memoryLevelVis)}>
                  <FormControlLabel
                    control={<Switch checked={memoryLevelVis} color="primary" />}
                    label="记忆层级可视化"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ width: '100%' }}
                  />
                </MenuItem>
                
                <Divider sx={{ my: 1 }} />
                
                <MenuItem onClick={handleSettingsClose}>
                  <Typography align="center" sx={{ width: '100%' }}>
                    关闭
                  </Typography>
                </MenuItem>
              </Menu>
          </Box>

          <Typography 
              variant="h5" 
              align="center" 
              sx={{ 
                  mb: 3,
                  fontWeight: 'bold',
                  background: themeColors.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
              }}
              className="gradient-text"
          >
              {sessionTitle}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Paper 
                  elevation={0}
                  sx={{ 
                      borderRadius: '30px',
                      overflow: 'hidden',
                      padding: '3px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(10px)'
                  }}
              >
                  <ToggleButtonGroup
                      color="primary"
                      value={learningMode}
                      exclusive
                      onChange={handleModeChange}
                      aria-label="学习模式"
                  >
                      <ToggleButton 
                          value="flashcard"
                          sx={{
                              borderRadius: '25px',
                              px: 3,
                              py: 1,
                              border: 'none',
                              '&.Mui-selected': {
                                  background: themeColors.gradient,
                                  color: 'white',
                                  boxShadow: `0 4px 10px rgba(${parseInt(themeColors.accent.substring(1, 3), 16)}, ${parseInt(themeColors.accent.substring(3, 5), 16)}, ${parseInt(themeColors.accent.substring(5, 7), 16)}, 0.3)`
                              }
                          }}
                      >
                          看卡认词
                      </ToggleButton>
                      <ToggleButton 
                          value="spelling"
                          sx={{
                              borderRadius: '25px',
                              px: 3,
                              py: 1,
                              border: 'none',
                              ml: 1,
                              '&.Mui-selected': {
                                  background: themeColors.gradient,
                                  color: 'white',
                                  boxShadow: `0 4px 10px rgba(${parseInt(themeColors.accent.substring(1, 3), 16)}, ${parseInt(themeColors.accent.substring(3, 5), 16)}, ${parseInt(themeColors.accent.substring(5, 7), 16)}, 0.3)`
                              }
                          }}
                      >
                          拼写单词
                      </ToggleButton>
                  </ToggleButtonGroup>
              </Paper>
          </Box>

          {currentWord && (
              <Fade in={true} timeout={500}>
                  <Card 
                      sx={{
                          width: '100%', 
                          maxWidth: 600,
                          minHeight: 300,
                          m: 'auto',
                          borderRadius: 2,
                          boxShadow: themeColors.boxShadow,
                          position: 'relative',
                          overflow: 'visible',
                          bgcolor: themeColors.primary,
                          border: `1px solid ${themeColors.border}`,
                          transition: 'all 0.3s ease',
                          cursor: learningMode === 'flashcard' ? 'pointer' : 'default'
                      }}
                      onClick={handleCardClick}
                  >
                      {/* 记忆层级指示器 */}
                      {memoryLevelVis && (
                          <Box 
                              sx={{ 
                                  position: 'absolute', 
                                  top: -5, 
                                  left: -5,
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: getMemoryLevelColor(getWordMemoryLevel()),
                                  boxShadow: '0 0 8px rgba(0,0,0,0.2)'
                              }}
                          />
                      )}

                      {/* 重要性标记 */}
                      {currentWord.importance > 0 && (
                          <Box 
                              sx={{ 
                                  position: 'absolute', 
                                  top: -5, 
                                  right: -5,
                                  p: 0.5,
                                  borderRadius: '50%',
                                  backgroundColor: getImportanceColor(currentWord.importance),
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 0 8px rgba(0,0,0,0.2)',
                                  zIndex: 1
                              }}
                          >
                              <StarIcon fontSize="small" />
                          </Box>
                      )}
                      
                      <Box sx={{ 
                          position: 'absolute', 
                          top: 10, 
                          right: 10, 
                          display: 'flex',
                          gap: 1
                      }}>
                          <IconButton 
                              size="small" 
                              onClick={handleToggleNotebook}
                              disabled={isSubmitting || loadingNotebookStatus}
                              sx={{ 
                                  color: isWordInNotebook 
                                      ? muiTheme?.palette?.mode === 'dark'
                                          ? 'rgba(255, 215, 0, 0.8)' 
                                          : 'rgba(255, 193, 7, 1)' 
                                      : 'inherit' 
                              }}
                              title={isWordInNotebook ? "从生词本移除" : "加入生词本"}
                          >
                              {isWordInNotebook ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                          
                          <IconButton 
                              size="small" 
                              onClick={playAudio}
                              disabled={playingAudio || !currentWord}
                              title="听发音"
                              sx={{
                                  color: muiTheme?.palette ? muiTheme.palette.primary.main : 'inherit'
                              }}
                          >
                              <VolumeUpIcon />
                          </IconButton>
                      </Box>
                      
                      <CardContent sx={{ pt: 2 }}>
                          <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              mb: 2,
                              flexWrap: 'wrap'
                          }}>
                              {learningMode === 'spelling' ? (
                                  <Typography 
                                      variant="h5" 
                                      component="h1"
                                      sx={{ 
                                          fontWeight: 700,
                                          color: muiTheme?.palette ? muiTheme.palette.text.primary : 'inherit',
                                          textAlign: 'center'
                                      }}
                                  >
                                      {currentWord.meaning || "加载中..."}
                                  </Typography>
                              ) : (
                                  <Typography 
                                      variant="h4" 
                                      component="h1"
                                      sx={{ 
                                          fontWeight: 700,
                                          color: muiTheme?.palette ? muiTheme.palette.text.primary : 'inherit',
                                          textAlign: 'center'
                                      }}
                                  >
                                      {currentWord.spelling}
                                  </Typography>
                              )}
                              
                              {renderPOS(currentWord.pos)}
                              
                              {currentWord.phonetic && learningMode !== 'spelling' && (
                                  <Typography 
                                      variant="body2"
                                      sx={{ 
                                          ml: 1, 
                                          color: muiTheme?.palette ? muiTheme.palette.text.secondary : 'inherit' 
                                      }}
                                  >
                                      [{currentWord.phonetic}]
                                  </Typography>
                              )}
                              
                              {/* 恢复单词状态显示 */}
                              {currentWord.status && (
                                  <Chip 
                                      label={currentWord.status}
                                      size="small"
                                      color={getStatusColor(currentWord.status)}
                                      sx={{
                                          ml: 1,
                                          fontWeight: 500,
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                      }}
                                  />
                              )}
                          </Box>

                          <Collapse in={(learningMode === 'flashcard' && isRevealed) || learningMode === 'spelling'}>
                              <Box sx={{ 
                                  borderRadius: 2, 
                                  mt: 2,
                                  mb: 1,
                                  px: 2, 
                                  py: 1,
                                  position: 'relative',
                                  zIndex: 2,
                                  bgcolor: `rgba(${parseInt(themeColors.accent.substring(1, 3), 16)}, ${parseInt(themeColors.accent.substring(3, 5), 16)}, ${parseInt(themeColors.accent.substring(5, 7), 16)}, 0.08)`
                              }}>
                                  <Typography variant="body1" sx={{ color: themeColors.text }}>
                                      {learningMode === 'spelling' ? (
                                          '请根据中文释义拼写单词'
                                      ) : (
                                          currentWord.meaning?.split('\n').map((line, i) => (
                                              <div key={i}>{line}</div>
                                          ))
                                      )}
                                  </Typography>
                              </Box>
                          </Collapse>

                          {learningMode === 'flashcard' && !isRevealed && (
                              <Box 
                                  onClick={handleCardClick}
                                  sx={{
                                      height: 150,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      borderRadius: 2,
                                      bgcolor: muiTheme?.palette ? 
                                          muiTheme.palette.mode === 'dark' 
                                              ? 'rgba(255, 255, 255, 0.05)' 
                                              : 'rgba(0, 0, 0, 0.02)' 
                                          : 'rgba(0, 0, 0, 0.02)',
                                      '&:hover': {
                                          bgcolor: muiTheme?.palette ? 
                                              muiTheme.palette.mode === 'dark' 
                                                  ? 'rgba(255, 255, 255, 0.08)' 
                                                  : 'rgba(0, 0, 0, 0.04)' 
                                              : 'rgba(0, 0, 0, 0.04)'
                                      }
                                  }}
                              >
                                  <Typography 
                                      variant="body1"
                                      sx={{ color: muiTheme?.palette ? muiTheme.palette.text.secondary : 'inherit' }}
                                  >
                                      点击卡片查看释义
                                  </Typography>
                              </Box>
                          )}
                          
                          {learningMode === 'spelling' && (
                              <Box sx={{ mt: 2 }}>
                                  <TextField
                                      fullWidth
                                      label="拼写这个单词"
                                      variant="outlined"
                                      value={spellingInput}
                                      onChange={(e) => setSpellingInput(e.target.value)}
                                      onKeyPress={handleSpellingKeyPress}
                                      disabled={feedback.show || isSubmitting}
                                      autoComplete="off"
                                      inputRef={spellingInputRef}
                                      sx={{
                                          '& .MuiOutlinedInput-root': {
                                              borderRadius: '12px',
                                              bgcolor: muiTheme?.palette ? 
                                                  muiTheme.palette.mode === 'dark' 
                                                      ? 'rgba(255, 255, 255, 0.05)' 
                                                      : 'rgba(255, 255, 255, 0.8)' 
                                                  : 'rgba(255, 255, 255, 0.8)'
                                          }
                                      }}
                                  />
                                  
                                  <Collapse in={feedback.show}>
                                      <Box sx={{ 
                                          mt: 2, 
                                          p: 2, 
                                          borderRadius: 2, 
                                          bgcolor: feedback.correct 
                                              ? muiTheme?.palette?.mode === 'dark' 
                                                  ? 'rgba(76, 175, 80, 0.15)'
                                                  : 'rgba(76, 175, 80, 0.1)'
                                              : muiTheme?.palette?.mode === 'dark'
                                                  ? 'rgba(244, 67, 54, 0.15)'
                                                  : 'rgba(244, 67, 54, 0.1)',
                                          display: 'flex',
                                          alignItems: 'center',
                                      }}>
                                          {feedback.correct ? (
                                              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                          ) : (
                                              <CancelIcon color="error" sx={{ mr: 1 }} />
                                          )}
                                          <Typography color={feedback.correct ? "success" : "error"}>
                                              {feedback.message}
                                          </Typography>
                                      </Box>
                                  </Collapse>
                                  
                                  {!feedback.show && (
                                      <Button
                                          variant="contained"
                                          onClick={handleCheckSpelling}
                                          disabled={isSubmitting || !spellingInput.trim()}
                                          fullWidth
                                          sx={{
                                              mt: 2,
                                              py: 1.5,
                                              borderRadius: '12px',
                                              background: themeColors.gradient, // 使用主题渐变色
                                              boxShadow: themeColors.boxShadow,
                                              '&:hover': {
                                                  background: themeColors.gradient,
                                                  filter: 'brightness(0.9)',
                                                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                                              }
                                          }}
                                      >
                                          检查
                                      </Button>
                                  )}
                              </Box>
                          )}
                      </CardContent>
                  </Card>
              </Fade>
          )}

          {error && !feedback.show && (
              <Alert 
                  severity="warning" 
                  sx={{ 
                      mt: 2,
                      borderRadius: '12px' 
                  }}
              >
                  {error}
              </Alert>
          )}

          {learningMode === 'flashcard' && (
              <Stack 
                  direction="row" 
                  spacing={2} 
                  justifyContent="center" 
                  sx={{ mt: 4 }}
              >
                  <Button 
                      variant="contained" 
                      color="error" 
                      onClick={() => recordAndProceed('dont_know')} 
                      disabled={isSubmitting || !currentWord}
                      sx={{ 
                          flexGrow: 1, 
                          py: 1.5,
                          px: 2,
                          borderRadius: '30px',
                          fontWeight: 'bold',
                          background: 'linear-gradient(90deg, #FF5252, #FF1744)', // 保留红色渐变
                          boxShadow: '0 4px 15px rgba(255, 82, 82, 0.3)',
                          '&:hover': {
                              background: 'linear-gradient(90deg, #FF1744, #D50000)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px rgba(255, 82, 82, 0.4)',
                          }
                      }}
                  > 
                      不认识 
                  </Button>
                  <Button 
                      variant="contained" 
                      color="success" 
                      onClick={() => recordAndProceed('know')} 
                      disabled={isSubmitting || !currentWord}
                      sx={{ 
                          flexGrow: 1, 
                          py: 1.5,
                          px: 2,
                          borderRadius: '30px',
                          fontWeight: 'bold',
                          background: themeColors.gradient, // 使用主题渐变色
                          boxShadow: themeColors.boxShadow,
                          '&:hover': {
                              background: themeColors.gradient,
                              filter: 'brightness(0.9)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                          }
                      }}
                  > 
                      认识 
                  </Button>
              </Stack>
          )}

          <Snackbar
              open={snackbarOpen}
              autoHideDuration={3000}
              onClose={handleSnackbarClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
              <Alert 
                  onClose={handleSnackbarClose} 
                  severity={snackbarSeverity} 
                  sx={{ 
                      width: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                  }}
                  variant="filled"
              >
                  {snackbarMessage}
              </Alert>
          </Snackbar>
      </Container>
  );
}

export default LearningPage;