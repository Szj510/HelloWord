import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';

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
// import VolumeUpIcon from '@mui/icons-material/VolumeUp'; // 发音图标
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
  const [wordbookName, setWordbookName] = useState('');
  const [wordsToLearn, setWordsToLearn] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 用于记录交互 API 调用
  const [isRevealed, setIsRevealed] = useState(false);

  // --- V 新增: 学习模式相关状态 --- V
  const [learningMode, setLearningMode] = useState('flashcard'); // 'flashcard' or 'spelling'
  const [spellingInput, setSpellingInput] = useState(''); // 拼写模式下的用户输入
  const [feedback, setFeedback] = useState({ show: false, correct: false, message: '' }); // 拼写反馈
  // --- ^ 新增结束 ^ ---

  const spellingInputRef = useRef(null); // 用于聚焦输入框
  const fetchWordbookData = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const data = await apiFetch(`/api/wordbooks/${wordbookId}`);
            if (data && data.words && Array.isArray(data.words)) {
                setWordbookName(data.name || '未知单词书');
                // TODO: 后续应根据复习算法获取和排序单词，这里暂时用单词书顺序
                setWordsToLearn(data.words);
                if (data.words.length === 0) { setError("这个单词书是空的，无法开始学习。"); }
                else {
                    setCurrentWordIndex(0);
                    // V--- 重置拼写相关状态 ---V
                    setSpellingInput('');
                    // 初始不聚焦，让用户先看提示
                    // setTimeout(() => spellingInputRef.current?.focus(), 100);
                    // --- ^ 重置结束 ^ ---
                }
            } else { throw new Error("无效的单词书数据格式"); }
        } catch (err) { setError(`加载学习会话失败: ${err.message}`); setWordsToLearn([]); }
        finally { setLoading(false); }
    }, [wordbookId]);
    useEffect(() => { fetchWordbookData(); }, [fetchWordbookData]);
  // 获取当前显示的单词
  const currentWord = wordsToLearn.length > 0 ? wordsToLearn[currentWordIndex] : null;

  const handleCardClick = () => { setIsRevealed(!isRevealed); };

    // --- V 新增: 处理模式切换 --- V
    const handleModeChange = (event, newMode) => {
        if (newMode !== null) { // ToggleButtonGroup 要求非空
            setLearningMode(newMode);
            setIsRevealed(false); // 切换模式时重置显示状态
            setSpellingInput(''); // 清空拼写输入
            setFeedback({ show: false, correct: false, message: '' }); // 清除反馈
            setError(''); // 清除通用错误
            // 切换到拼写模式时自动聚焦输入框
            if (newMode === 'spelling') {
                // 使用 setTimeout 确保输入框已渲染
                setTimeout(() => spellingInputRef.current?.focus(), 0);
            }
        }
    };

    // --- V 新增: 处理拼写检查 --- V
    const handleCheckSpelling = () => {
        if (!currentWord || isSubmitting) return;

        const isCorrect = spellingInput.trim().toLowerCase() === currentWord.spelling.toLowerCase();

        setFeedback({ show: true, correct: isCorrect, message: isCorrect ? '正确!' : `正确答案: ${currentWord.spelling}` });

        // 重要: 只有在给出反馈后才记录并前进 (例如用户看到反馈后点击 "继续" 按钮)
        // 或者: 无论对错都记录，然后前进 (更快的节奏)
        // 我们先采用无论对错都记录并前进的方式

        // 延迟一点时间让用户看到反馈，然后记录并前进
        setIsSubmitting(true); // 标记为提交中，防止此时切换单词
        setTimeout(() => {
             // 将拼写对错映射为 'know' / 'dont_know' 来调用现有 API
            recordAndProceed(isCorrect ? 'know' : 'dont_know');
            // 注意：recordAndProceed 内部的 finally 会将 isSubmitting 设为 false
        }, isCorrect ? 800 : 1500); // 正确反馈显示短一点，错误反馈显示长一点

    };

    // 处理拼写输入框的回车事件
     const handleSpellingKeyPress = (event) => {
         if (event.key === 'Enter' && !feedback.show) { // 只有在没有显示反馈时回车才有效
             handleCheckSpelling();
         }
     };

     // --- V 新增: 播放发音 (需要后端支持或第三方 API) --- V
     const playAudio = () => {
         console.log("TODO: 实现播放发音功能");
         // if (currentWord?.audio_us || currentWord?.audio_uk) {
         //    const audio = new Audio(currentWord.audio_us || currentWord.audio_uk);
         //    audio.play();
         // } else {
         //    // 使用 TTS API, e.g., Web Speech API
         //    if ('speechSynthesis' in window) {
         //        const utterance = new SpeechSynthesisUtterance(currentWord.spelling);
         //        // utterance.lang = 'en-US'; // 可以指定语言
         //        window.speechSynthesis.speak(utterance);
         //    } else {
         //        alert("浏览器不支持语音合成");
         //    }
         // }
          if (currentWord && 'speechSynthesis' in window) {
              try {
                 const utterance = new SpeechSynthesisUtterance(currentWord.spelling);
                 utterance.lang = 'en-US'; // 尝试指定美音
                 window.speechSynthesis.cancel(); // 取消之前的发音 (如果有)
                 window.speechSynthesis.speak(utterance);
              } catch (e) {
                   console.error("语音合成错误:", e);
                   alert("无法播放发音");
               }
           } else if (currentWord) {
               alert("浏览器不支持语音合成或单词无效");
           }

     };

    // 前进到下一个单词 (修改: 重置拼写状态)
    const goToNextWord = () => {
        if (currentWordIndex < wordsToLearn.length - 1) {
            setCurrentWordIndex(currentWordIndex + 1);
            setIsRevealed(false);
            setSpellingInput(''); // 清空拼写输入
            setFeedback({ show: false, correct: false, message: '' }); // 清除反馈
            setError(''); // 清除通用错误
             // 切换后聚焦 (如果模式是 spelling)
             if (learningMode === 'spelling') {
                  setTimeout(() => spellingInputRef.current?.focus(), 0);
              }
        } else {
            alert("恭喜！本轮学习完成！");
            navigate('/wordbooks');
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
            goToNextWord(); // 记录成功后前进
        } catch (err) { setError(`记录学习数据时出错: ${err.message}`); }
        finally { setIsSubmitting(false); }
    };
  
  // ... (Loading 和 Error 状态的 JSX 不变) ...
  if (loading) { /* ... */
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              <CircularProgress />
          </Box>
      );
  }
  if (error && wordsToLearn.length === 0) { // 只有在没有单词可显示时才显示错误并阻止渲染卡片
      return (
           <Container maxWidth="sm">
              <Alert severity="error" sx={{ mt: 4 }}>
                  {error}
                  <Button onClick={() => navigate('/wordbooks')} sx={{ ml: 2 }}>返回单词书列表</Button>
               </Alert>
           </Container>
       );
  }
   if (!currentWord && !loading) { /* ... */ // (例如单词书为空，已在 fetch 中设置 error)
        return (
             <Container maxWidth="sm">
                 {/* Error Alert 应该已经显示了 */}
             </Container>
        );
    }


  return (
        <Container maxWidth="sm">
            <Typography variant="h5" gutterBottom align="center" sx={{ mt: 2 }}>
                学习: {wordbookName} ({currentWordIndex + 1} / {wordsToLearn.length})
            </Typography>

            {/* --- V 新增: 模式切换按钮 --- V */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <ToggleButtonGroup
                    color="primary"
                    value={learningMode}
                    exclusive // 一次只能选一个
                    onChange={handleModeChange}
                    aria-label="Learning Mode"
                    size="small"
                >
                    <ToggleButton value="flashcard">看卡认词</ToggleButton>
                    <ToggleButton value="spelling">拼写单词</ToggleButton>
                    {/* 可以添加更多模式按钮 */}
                </ToggleButtonGroup>
            </Box>
            {/* --- ^ 新增结束 ^ --- */}

            {currentWord && (
                <Card variant="outlined" sx={{ mt: 1, position: 'relative' }}>
                    {/* 状态 Chip (不变) */}
                    {currentWord.status && (<Chip label={currentWord.status} size="small" color={getStatusColor(currentWord.status)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}/> )}

                    {/* --- V 修改: 根据模式渲染不同内容 --- V */}
                    {learningMode === 'flashcard' ? (
                        // --- Flashcard 模式 ---
                        <Box onClick={handleCardClick} sx={{ cursor: 'pointer' }}>
                            <CardContent sx={{ minHeight: 200, display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign: 'center' }}>
                                <Typography variant="h3" component="div" sx={{ mb: 1.5 }}>
                                    {currentWord.spelling}
                                    {/* 发音按钮 */}
                                    <IconButton onClick={(e) => { e.stopPropagation(); playAudio(); }} size="small" sx={{ ml: 1 }} title="播放发音">
                                         <span role="img" aria-label="play audio">🔊</span>
                                        {/* <VolumeUpIcon fontSize="inherit" /> */}
                                    </IconButton>
                                </Typography>
                                <Collapse in={isRevealed} timeout="auto" unmountOnExit>
                                    {currentWord.phonetic && (<Typography sx={{ mb: 1, mt: 1 }} color="text.secondary"> [{currentWord.phonetic}] </Typography> )}
                                    <Typography variant="body1" sx={{mt:2}}> {currentWord.meaning} </Typography>
                                    {currentWord.examples && currentWord.examples.length > 0 && (<Typography variant="body2" sx={{mt:1, fontStyle:'italic'}}> 例: {currentWord.examples[0].sentence} </Typography> )}
                                </Collapse>
                                {!isRevealed && ( <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}> (点击卡片查看详情) </Typography> )}
                            </CardContent>
                        </Box>
                    ) : (
                        // --- Spelling 模式 ---
                        <CardContent sx={{ minHeight: 200, display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign: 'center' }}>
                             {/* 显示释义和音标 */}
                            <Typography variant="h6" sx={{ mb: 1 }}>{currentWord.meaning}</Typography>
                            {currentWord.phonetic && (
                                <Typography sx={{ mb: 2 }} color="text.secondary">
                                    [{currentWord.phonetic}]
                                     {/* 发音按钮 */}
                                     <IconButton onClick={playAudio} size="small" sx={{ ml: 1 }} title="播放发音">
                                         <span role="img" aria-label="play audio">🔊</span>
                                         {/* <VolumeUpIcon fontSize="inherit" /> */}
                                     </IconButton>
                                </Typography>
                            )}
                            {/* 拼写输入框 */}
                            <TextField
                                inputRef={spellingInputRef} // 关联 ref
                                variant="outlined"
                                size="small"
                                value={spellingInput}
                                onChange={(e) => setSpellingInput(e.target.value)}
                                onKeyPress={handleSpellingKeyPress} // 处理回车
                                placeholder="输入单词拼写"
                                sx={{ mb: 2, width: '80%' }}
                                disabled={feedback.show || isSubmitting} // 显示反馈或提交中时禁用
                                // 根据反馈显示错误或成功状态
                                error={feedback.show && !feedback.correct}
                                // success={feedback.show && feedback.correct} // MUI TextField 没有 success prop，可以通过 helperText 或边框颜色模拟
                                InputProps={{
                                     sx: {
                                        ...(feedback.show && feedback.correct && { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'success.main' } }),
                                    }
                                }}
                            />
                             {/* 检查按钮 */}
                            <Button
                                variant="contained"
                                onClick={handleCheckSpelling}
                                disabled={feedback.show || isSubmitting || !spellingInput.trim()} // 没输入也不能点
                            >
                                检查答案
                            </Button>
                             {/* 拼写反馈 */}
                             <Collapse in={feedback.show} sx={{width: '80%', mt: 1}}>
                                 <Alert severity={feedback.correct ? 'success' : 'error'}>
                                     {feedback.message}
                                 </Alert>
                             </Collapse>
                        </CardContent>
                    )}
                    {/* --- ^ 修改结束 ^ --- */}

                </Card>
            )}

             {/* 通用错误区域 */}
            {error && !feedback.show && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}


            {/* --- V 修改: 根据模式显示不同按钮 --- V */}
            {learningMode === 'flashcard' ? (
                // Flashcard 模式下的按钮
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                    <Button variant="contained" color="error" onClick={() => recordAndProceed('dont_know')} disabled={isSubmitting || !currentWord} sx={{ flexGrow: 1, paddingY: 1.5 }}> 不认识 </Button>
                    <Button variant="contained" color="success" onClick={() => recordAndProceed('know')} disabled={isSubmitting || !currentWord} sx={{ flexGrow: 1, paddingY: 1.5 }}> 认识 </Button>
                </Stack>
            ) : (
                 // Spelling 模式下不需要额外的 "认识/不认识" 按钮, 交互由 "检查答案" 驱动
                 // 可以保留一个“跳过”按钮？或者其他辅助按钮？
                 null // 暂时不显示额外按钮
            )}
            {/* --- ^ 修改结束 ^ --- */}

        </Container>
    );
 }



export default LearningPage;