import React, { useState, useEffect, useCallback } from 'react';
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

function LearningPage() {
  const { wordbookId } = useParams();
  const navigate = useNavigate();
  const [wordbookName, setWordbookName] = useState('');
  const [wordsToLearn, setWordsToLearn] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 防止重复点击交互按钮

  // ... (fetchWordbookData 函数不变) ...
   const fetchWordbookData = useCallback(async () => {
       setLoading(true);
       setError('');
       try {
         console.log(`Workspaceing data for wordbook: ${wordbookId}`);
         const data = await apiFetch(`/api/wordbooks/${wordbookId}`);
         if (data && data.words && Array.isArray(data.words)) {
             setWordbookName(data.name || '未知单词书');
             setWordsToLearn(data.words);
             if (data.words.length === 0) {
                 setError("这个单词书是空的，无法开始学习。");
             } else {
                 setCurrentWordIndex(0);
             }
         } else {
             throw new Error("无效的单词书数据格式");
         }
       } catch (err) {
         console.error('获取单词书数据失败:', err);
         setError(`加载学习会话失败: ${err.message}`);
         setWordsToLearn([]);
       } finally {
         setLoading(false);
       }
   }, [wordbookId]);

   useEffect(() => {
       fetchWordbookData();
   }, [fetchWordbookData]);


  // 获取当前显示的单词
  const currentWord = wordsToLearn.length > 0 ? wordsToLearn[currentWordIndex] : null;

  // 处理学习交互 (认识/不认识)
  const handleInteraction = async (action) => {
    if (!currentWord || isSubmitting) return; // 防止在没有单词或提交中时操作

    setIsSubmitting(true); // 开始提交
    setError('');        // 清除旧错误

    try {
      console.log(`Recording action: ${action} for word: ${currentWord._id}`);
      await apiFetch('/api/learning/record', {
        method: 'POST',
        body: JSON.stringify({
          wordId: currentWord._id,
          action: action, // 'know' or 'dont_know'
          // wordbookId: wordbookId // 可选：传递单词书 ID
        }),
      });

      // 交互成功后，自动进入下一个单词
      goToNextWord();

    } catch (err) {
      console.error('记录交互失败:', err);
      setError(`记录学习数据时出错: ${err.message}`);
      // 交互失败，停留在当前单词，显示错误
    } finally {
      setIsSubmitting(false); // 结束提交
    }
  };


  // 前进到下一个单词
  const goToNextWord = () => {
    if (currentWordIndex < wordsToLearn.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // 学习完成，可以跳转到总结页面或返回列表
      alert("恭喜！本轮学习完成！"); // 临时提示
      navigate('/wordbooks'); // 返回单词书列表
    }
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

       {/* 显示单词卡片 */}
      {currentWord && (
         <Card variant="outlined" sx={{ mt: 2 }}>
             <CardContent sx={{ minHeight: 200, display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' }}>
                 <Typography variant="h3" component="div" sx={{ mb: 1.5 }}>
                    {currentWord.spelling}
                 </Typography>
                 {currentWord.phonetic && (
                     <Typography sx={{ mb: 1 }} color="text.secondary">
                        [{currentWord.phonetic}]
                     </Typography>
                 )}
                 {/* TODO: 实现点击显示/隐藏 */}
                 <Typography variant="body1" sx={{mt:2}}>
                     {currentWord.meaning}
                 </Typography>
             </CardContent>
         </Card>
      )}

       {/* 显示交互错误（如果记录失败）*/}
       {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}

      {/* 交互按钮 */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="error" // "不认识" 使用红色系
          onClick={() => handleInteraction('dont_know')}
          disabled={isSubmitting || !currentWord}
          sx={{ flexGrow: 1, paddingY: 1.5 }} // 增大按钮
        >
          不认识
        </Button>
        <Button
          variant="contained"
          color="success" // "认识" 使用绿色系
          onClick={() => handleInteraction('know')}
          disabled={isSubmitting || !currentWord}
          sx={{ flexGrow: 1, paddingY: 1.5 }} // 增大按钮
        >
          认识
        </Button>
      </Stack>
       {/* 可以保留一个“跳过”或“查看详情”按钮 */}
       {/* <Button variant="outlined" sx={{mt: 2, width: '100%'}}>查看详情</Button> */}

    </Container>
  );
}

export default LearningPage;