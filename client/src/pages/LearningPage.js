import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiFetch from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';
import VolumeUpIcon from '@mui/icons-material/VolumeUp'; // 发音图标
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // 提示图标
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // 正确图标
import CancelIcon from '@mui/icons-material/Cancel'; // 错误图标
import Grow from '@mui/material/Grow'; // 添加Grow动画效果

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
  const { isAuthenticated, user } = useAuth();
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
  const [playingAudio, setPlayingAudio] = useState(false); // 新增：控制发音按钮状态
    
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  // Snackbar functions
  const showSnackbar = (message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); };
  const handleSnackbarClose = (event, reason) => { if (reason === 'clickaway') { return; } setSnackbarOpen(false); };
  
  const fetchLearningSession = useCallback(async () => {
      setLoading(true);
      setError('');
      setWordsToLearn([]); // 清空旧数据
      try {
          const params = new URLSearchParams({ wordbookId });
          if (initialNewLimit) params.append('newLimit', initialNewLimit);
          if (initialReviewLimit) params.append('reviewLimit', initialReviewLimit);

          const data = await apiFetch(`/api/learning/session?${params.toString()}`);

          if (data && data.sessionWords && Array.isArray(data.sessionWords)) {
              if (data.sessionWords.length === 0) {
                  setSessionTitle("任务完成"); // 更新标题
              } else {
                  setWordsToLearn(data.sessionWords);
                  setCurrentWordIndex(0);
                  setIsRevealed(false);
                  setFeedback({ show: false, correct: false, message: '' });
                  setSpellingInput('');
                  setSessionTitle(`学习会话`); // 通用标题
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
  }, [wordbookId, initialNewLimit, initialReviewLimit, learningMode]);

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
  
  const handleCardClick = () => { setIsRevealed(!isRevealed); };

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

  return (
      <Container maxWidth="sm" className="animate-fade-in">
          <Box sx={{ mt: 4, mb: 1 }}>
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
                          background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                      }
                  }}
              />
          </Box>

          <Typography 
              variant="h5" 
              align="center" 
              sx={{ 
                  mb: 3,
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
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
                                  background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                  color: 'white',
                                  boxShadow: '0 4px 10px rgba(71, 118, 230, 0.3)'
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
                                  background: 'linear-gradient(90deg, #8E54E9, #4776E6)',
                                  color: 'white',
                                  boxShadow: '0 4px 10px rgba(142, 84, 233, 0.3)'
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
                      elevation={0} 
                      className="card-neumorphic" 
                      sx={{ 
                          borderRadius: '16px',
                          position: 'relative',
                          overflow: 'visible',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 15px 30px rgba(71, 118, 230, 0.1)'
                          }
                      }}
                  >
                      {currentWord.status && (
                          <Chip 
                              label={currentWord.status} 
                              size="small" 
                              color={getStatusColor(currentWord.status)} 
                              sx={{ 
                                  position: 'absolute', 
                                  top: 12, 
                                  right: 12, 
                                  zIndex: 1,
                                  fontWeight: '500',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                              }}
                          /> 
                      )}

                      <Tooltip 
                          title={isWordInNotebook ? "从生词本移除" : "添加到生词本"}
                          placement="left"
                          TransitionComponent={Zoom}
                      >
                          <IconButton
                              onClick={handleToggleNotebook}
                              disabled={loadingNotebookStatus || isSubmitting}
                              color={isWordInNotebook ? "primary" : "default"}
                              sx={{ 
                                  position: 'absolute', 
                                  top: 8, 
                                  left: 8, 
                                  zIndex: 1,
                                  background: isWordInNotebook ? 'rgba(71, 118, 230, 0.1)' : 'transparent',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                      background: isWordInNotebook ? 'rgba(71, 118, 230, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                                  }
                              }}
                          >
                              {isWordInNotebook ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                      </Tooltip>

                      {learningMode === 'flashcard' ? (
                          <Box 
                              onClick={handleCardClick} 
                              sx={{ 
                                  cursor: 'pointer',
                                  position: 'relative',
                                  minHeight: 280,
                                  padding: 3,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  textAlign: 'center',
                              }}
                          >
                              <CardContent>
                                  <Typography 
                                      variant="h3" 
                                      component="div" 
                                      sx={{ 
                                          mb: 2,
                                          fontWeight: 'bold',
                                          color: '#333'
                                      }}
                                  >
                                      {currentWord.spelling}
                                      <Tooltip title="播放发音" placement="top">
                                          <IconButton 
                                              onClick={(e) => { 
                                                  e.stopPropagation(); 
                                                  playAudio(); 
                                              }} 
                                              color="primary"
                                              disabled={playingAudio}
                                              size="small" 
                                              sx={{ 
                                                  ml: 1.5,
                                                  animation: playingAudio ? 'pulse 1s infinite' : 'none'
                                              }}
                                          >
                                              <VolumeUpIcon />
                                          </IconButton>
                                      </Tooltip>
                                  </Typography>

                                  <Collapse in={isRevealed} timeout={500}>
                                      <Box 
                                          sx={{ 
                                              py: 2, 
                                              px: 3, 
                                              mt: 2, 
                                              borderRadius: '12px',
                                              background: 'rgba(142, 84, 233, 0.05)',
                                              border: '1px dashed rgba(142, 84, 233, 0.2)'
                                          }}
                                      >
                                          {currentWord.phonetic && (
                                              <Typography 
                                                  sx={{ mb: 1.5 }} 
                                                  color="text.secondary"
                                                  fontStyle="italic"
                                              > 
                                                  [{currentWord.phonetic}] 
                                              </Typography> 
                                          )}
                                          
                                          <Typography 
                                              variant="h6" 
                                              sx={{
                                                  fontWeight: '500',
                                                  mb: 2
                                              }}
                                          > 
                                              {currentWord.meaning} 
                                          </Typography>
                                          
                                          {currentWord.examples && currentWord.examples.length > 0 && (
                                              <Typography 
                                                  variant="body1" 
                                                  sx={{
                                                      fontStyle: 'italic',
                                                      color: 'text.secondary',
                                                      borderLeft: '3px solid rgba(142, 84, 233, 0.3)',
                                                      pl: 2,
                                                      py: 0.5
                                                  }}
                                              > 
                                                  {currentWord.examples[0].sentence} 
                                              </Typography> 
                                          )}
                                      </Box>
                                  </Collapse>

                                  {!isRevealed && (
                                      <Box 
                                          sx={{ 
                                              mt: 3, 
                                              display: 'flex', 
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                          }}
                                      >
                                          <HelpOutlineIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
                                          <Typography variant="body2" color="text.secondary">
                                              点击卡片查看详细释义
                                          </Typography>
                                      </Box>
                                  )}
                              </CardContent>
                          </Box>
                      ) : (
                          <CardContent sx={{ 
                              minHeight: 280, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'center',
                              alignItems: 'center', 
                              textAlign: 'center',
                              p: 4
                          }}>
                              <Typography 
                                  variant="h5" 
                                  sx={{ 
                                      mb: 1.5,
                                      fontWeight: 'bold',
                                      color: '#333'
                                  }}
                              >
                                  {currentWord.meaning}
                              </Typography>
                              
                              {currentWord.phonetic && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                      <Typography 
                                          color="text.secondary"
                                          fontStyle="italic"
                                      >
                                          [{currentWord.phonetic}]
                                      </Typography>
                                      
                                      <Tooltip title="播放发音" placement="top">
                                          <IconButton 
                                              onClick={playAudio}
                                              color="primary"
                                              disabled={playingAudio}
                                              size="small" 
                                              sx={{ 
                                                  ml: 1,
                                                  animation: playingAudio ? 'pulse 1s infinite' : 'none'
                                              }}
                                          >
                                              <VolumeUpIcon />
                                          </IconButton>
                                      </Tooltip>
                                  </Box>
                              )}
                              
                              <TextField
                                  inputRef={spellingInputRef}
                                  variant="outlined"
                                  size="medium"
                                  value={spellingInput}
                                  onChange={(e) => setSpellingInput(e.target.value)}
                                  onKeyPress={handleSpellingKeyPress}
                                  placeholder="输入单词拼写"
                                  sx={{ 
                                      mb: 3, 
                                      width: '90%',
                                      '& .MuiOutlinedInput-root': {
                                          borderRadius: '12px',
                                          '&.Mui-focused': {
                                              '& fieldset': {
                                                  borderColor: '#4776E6',
                                                  borderWidth: '2px'
                                              }
                                          }
                                      }
                                  }}
                                  disabled={feedback.show || isSubmitting}
                                  error={feedback.show && !feedback.correct}
                                  InputProps={{
                                      sx: {
                                          ...(feedback.show && feedback.correct && { 
                                              '& .MuiOutlinedInput-notchedOutline': { 
                                                  borderColor: '#4CAF50',
                                                  borderWidth: '2px'
                                              } 
                                          }),
                                      }
                                  }}
                              />
                              
                              <Button
                                  variant="contained"
                                  onClick={handleCheckSpelling}
                                  disabled={feedback.show || isSubmitting || !spellingInput.trim()}
                                  sx={{
                                      borderRadius: '30px',
                                      px: 4,
                                      py: 1.2,
                                      background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                      fontWeight: 'bold',
                                      boxShadow: '0 4px 15px rgba(71, 118, 230, 0.3)',
                                      '&:hover': {
                                          transform: 'translateY(-2px)',
                                          boxShadow: '0 6px 20px rgba(71, 118, 230, 0.4)',
                                      },
                                      '&.Mui-disabled': {
                                          background: '#e0e0e0',
                                          boxShadow: 'none',
                                          color: '#a0a0a0'
                                      }
                                  }}
                              >
                                  检查答案
                              </Button>
                              
                              <Collapse in={feedback.show} sx={{ width: '90%', mt: 2 }}>
                                  <Alert 
                                      severity={feedback.correct ? 'success' : 'error'}
                                      icon={feedback.correct ? <CheckCircleIcon fontSize="inherit" /> : <CancelIcon fontSize="inherit" />}
                                      sx={{
                                          borderRadius: '12px',
                                          '&.MuiAlert-standardSuccess': {
                                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                              color: '#357a38'
                                          },
                                          '&.MuiAlert-standardError': {
                                              backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                              color: '#c62828'
                                          }
                                      }}
                                  >
                                      {feedback.message}
                                  </Alert>
                              </Collapse>
                          </CardContent>
                      )}
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
                          background: 'linear-gradient(90deg, #FF5252, #FF1744)',
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
                          background: 'linear-gradient(90deg, #4CAF50, #43A047)',
                          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                          '&:hover': {
                              background: 'linear-gradient(90deg, #43A047, #388E3C)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
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