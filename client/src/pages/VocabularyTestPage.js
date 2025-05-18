import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Paper, LinearProgress, Grid, Card, CardContent, Divider, Chip, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TestResultChart from '../components/vocabulary/TestResultChart';

const VocabularyTestPage = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { testId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // 初始化或加载现有测试
  useEffect(() => {
    const fetchOrCreateTest = async () => {
      try {
        setLoading(true);
        
        if (!token) {
          setError('您需要登录才能使用此功能');
          setLoading(false);
          return;
        }
        
        // 如果URL中有测试ID，则获取特定测试
        if (testId) {
          const specificTestResponse = await axios.get(`/api/vocabulary-test/${testId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (specificTestResponse.data.test) {
            setCurrentTest(specificTestResponse.data.test);
          } else {
            setError('找不到指定的测试记录');
          }
        } else {
          // 尝试获取当前进行中的测试或最新完成的测试
          const currentTestResponse = await axios.get('/api/vocabulary-test/current', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          // 检查是否有进行中的测试
          if (currentTestResponse.data.test && currentTestResponse.data.test.status === 'in_progress') {
            setCurrentTest(currentTestResponse.data.test);
            
            // 寻找第一个未回答的单词
            const firstUnansweredIndex = currentTestResponse.data.test.testWords.findIndex(
              word => word.userAnswer === undefined
            );
            
            if (firstUnansweredIndex !== -1) {
              setCurrentWordIndex(firstUnansweredIndex);
            }
          } else if (location.state && location.state.startNewTest) {
            // 用户主动要求开始新测试
            await startNewTest();
          } else if (currentTestResponse.data.test && currentTestResponse.data.test.status === 'completed') {
            // 如果有已完成的测试，直接显示结果
            setCurrentTest(currentTestResponse.data.test);
            
            // 如果是从历史页面过来，显示一条提示信息
            if (location.state && location.state.testDate) {
              console.log(`正在显示完成于 ${location.state.testDate} 的测试`);
            }
          } else if (!currentTestResponse.data.test) {
            // 没有任何测试记录，询问用户是否开始新测试
            setShowConfirmation(true);
          }
        }
      } catch (err) {
        console.error('加载测试失败:', err);
        setError('加载测试数据时出错，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrCreateTest();
  }, [token, location.state, testId]);
  
  // 开始新的词汇量测试
  const startNewTest = async () => {
    try {
      setLoading(true);
      if (!token) {
        setError('您需要登录才能使用此功能');
        setLoading(false);
        return;
      }
      
      const response = await axios.post('/api/vocabulary-test/start', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCurrentTest(response.data.test);
      setCurrentWordIndex(0);
      setShowAnswer(false);
    } catch (err) {
      console.error('创建测试失败:', err);
      setError('创建新测试时出错，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  // 回答当前单词
  const answerCurrentWord = async (answer) => {
    if (!currentTest || !currentTest.testWords[currentWordIndex] || !token) return;
    
    try {
      const wordId = currentTest.testWords[currentWordIndex].word;
      
      await axios.post(`/api/vocabulary-test/${currentTest._id}/answer`, {
        wordId,
        answer
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // 更新本地状态
      const updatedTest = { ...currentTest };
      updatedTest.testWords[currentWordIndex].isCorrect = answer;
      updatedTest.testWords[currentWordIndex].userAnswer = answer.toString();
      
      // 更新计数器
      if (answer) {
        updatedTest.correctAnswers = (updatedTest.correctAnswers || 0) + 1;
      } else {
        updatedTest.incorrectAnswers = (updatedTest.incorrectAnswers || 0) + 1;
      }
      
      // 检查是否完成测试
      const answeredCount = updatedTest.correctAnswers + updatedTest.incorrectAnswers;
      if (answeredCount >= updatedTest.totalWords) {
        // 获取更新后的测试结果
        const resultResponse = await axios.get('/api/vocabulary-test/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCurrentTest(resultResponse.data.test);
      } else {
        setCurrentTest(updatedTest);
        setShowAnswer(true);
      }
    } catch (err) {
      console.error('提交答案失败:', err);
      setError('提交答案时出错，请稍后再试');
    }
  };
  
  // 继续下一个单词
  const goToNextWord = () => {
    if (currentWordIndex < currentTest.testWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowAnswer(false);
    }
  };
  
  // 放弃当前测试
  const abandonTest = async () => {
    if (!currentTest || !token) return;
    
    try {
      await axios.delete(`/api/vocabulary-test/${currentTest._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // 询问用户是否开始新测试
      setShowConfirmation(true);
    } catch (err) {
      console.error('放弃测试失败:', err);
      setError('放弃测试时出错，请稍后再试');
    }
  };
  
  // 计算完成进度
  const calculateProgress = () => {
    if (!currentTest) return 0;
    
    const answeredCount = (currentTest.correctAnswers || 0) + (currentTest.incorrectAnswers || 0);
    return (answeredCount / currentTest.totalWords) * 100;
  };
  
  // 渲染测试结果
  const renderTestResults = () => {
    if (!currentTest || currentTest.status !== 'completed') return null;
    
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom align="center">测试结果</Typography>
        
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom>
            {currentTest.estimatedVocabulary.toLocaleString()} 词汇量
          </Typography>
          <Chip 
            label={`水平: ${getLevelName(currentTest.level)}`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: '1rem', p: 1 }}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">正确率</Typography>
                <Typography variant="h5">
                  {calculatePercentage(currentTest.correctAnswers, currentTest.totalWords)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">测试单词总数</Typography>
                <Typography variant="h5">{currentTest.totalWords}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <TestResultChart test={currentTest} />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/vocabulary-test', { state: { startNewTest: true } })}
            sx={{ mr: 2 }}
          >
            重新测试
          </Button>
          {testId ? (
            <Button 
              variant="outlined"
              onClick={() => navigate('/vocabulary-test-history')}
            >
              返回历史列表
            </Button>
          ) : (
            <Button 
              variant="outlined"
              onClick={() => navigate('/vocabulary-test-history')}
            >
              查看历史测试
            </Button>
          )}
        </Box>
      </Paper>
    );
  };
  
  // 渲染单词测试
  const renderWordTest = () => {
    if (!currentTest || currentTest.status !== 'in_progress') return null;
    
    const currentTestWord = currentTest.testWords[currentWordIndex];
    if (!currentTestWord) return null;
    
    const currentWord = currentTestWord.wordDetail;
    
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <LinearProgress 
          variant="determinate" 
          value={calculateProgress()} 
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          进度: {(currentTest.correctAnswers || 0) + (currentTest.incorrectAnswers || 0)} / {currentTest.totalWords}
        </Typography>
        
        <Typography variant="h5" gutterBottom>
          您认识这个单词吗？
        </Typography>
        
        <Box sx={{ 
          p: 3, 
          my: 2, 
          bgcolor: 'background.default', 
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography variant="h4" gutterBottom>
            {currentWord.spelling}
          </Typography>
          
          {showAnswer && (
            <Box sx={{ mt: 2, width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
                释义:
              </Typography>
              <Typography variant="body1">
                {currentWord.meaning}
              </Typography>
              
              {currentWord.examples && currentWord.examples.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    例句:
                  </Typography>
                  <List dense>
                    {currentWord.examples.map((example, idx) => (
                      <ListItem key={idx}>
                        <ListItemText 
                          primary={example.sentence} 
                          secondary={example.translation}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Box>
        
        {!showAnswer ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button 
              variant="contained" 
              color="success"
              size="large"
              onClick={() => answerCurrentWord(true)}
              sx={{ minWidth: 120 }}
            >
              认识
            </Button>
            <Button 
              variant="contained" 
              color="error"
              size="large"
              onClick={() => answerCurrentWord(false)}
              sx={{ minWidth: 120 }}
            >
              不认识
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={goToNextWord}
              sx={{ minWidth: 120 }}
            >
              继续
            </Button>
          </Box>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="text" 
            color="error"
            onClick={abandonTest}
          >
            放弃测试
          </Button>
        </Box>
      </Paper>
    );
  };
  
  // 帮助函数
  const calculatePercentage = (part, total) => {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  };
  
  const getLevelName = (level) => {
    const levelNames = {
      'beginner': '初学者',
      'elementary': '基础',
      'intermediate': '中级',
      'upper_intermediate': '中高级',
      'advanced': '高级',
      'proficient': '精通'
    };
    return levelNames[level] || level;
  };
  
  // 主渲染
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>词汇量测试</Typography>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>加载中...</Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>词汇量测试</Typography>
        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            重试
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>词汇量测试</Typography>
      <Typography variant="subtitle1" gutterBottom>
        测试您的英语词汇量水平，了解您的真实词汇量
      </Typography>
      
      {renderWordTest()}
      {renderTestResults()}
      
      {/* 确认对话框 */}
      <Dialog open={showConfirmation}>
        <DialogTitle>开始词汇量测试</DialogTitle>
        <DialogContent>
          <DialogContentText>
            本测试将通过精心设计的词汇分级抽样，测试您的真实词汇量水平。测试结束后将给出您的大致词汇量和英语水平级别。
            
            测试包含不同难度级别的单词，需要约5-10分钟完成。
            
            准备好开始了吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowConfirmation(false);
            navigate(-1);
          }}>
            取消
          </Button>
          <Button onClick={() => {
            setShowConfirmation(false);
            startNewTest();
          }} variant="contained" color="primary">
            开始测试
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VocabularyTestPage; 