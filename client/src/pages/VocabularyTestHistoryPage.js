import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Pagination,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import TestResultChart from '../components/vocabulary/TestResultChart';

const VocabularyTestHistoryPage = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tests, setTests] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [selectedTest, setSelectedTest] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  useEffect(() => {
    if (token) {
      fetchTestHistory(1);
    } else {
      setError('您需要登录才能查看测试历史');
      setLoading(false);
    }
  }, [token]);
  
  // 获取测试历史
  const fetchTestHistory = async (page) => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('您需要登录才能查看测试历史');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/vocabulary-test/history?page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setTests(response.data.tests || []);
      setPagination(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
      });
      
    } catch (err) {
      console.error('获取测试历史失败:', err);
      setError('获取测试历史失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  // 查看测试详情
  const viewTestDetail = async (test) => {
    setSelectedTest(test);
    setDetailDialogOpen(true);
    
    // 如果测试记录不完整，尝试获取更多数据
    if (!test.testWords || test.testWords.length === 0) {
      try {
        setDetailLoading(true);
        // 使用新的API获取特定ID的测试详情
        const response = await axios.get(`/api/vocabulary-test/${test._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.test) {
          setSelectedTest(response.data.test);
        }
      } catch (err) {
        console.error('获取测试详情失败:', err);
      } finally {
        setDetailLoading(false);
      }
    }
  };
  
  // 关闭详情对话框
  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedTest(null);
  };
  
  // 处理分页变化
  const handlePageChange = (event, value) => {
    fetchTestHistory(value);
  };
  
  // 转换日期格式
  const formatDate = (dateString) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm');
  };
  
  // 获取级别名称
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
  
  // 计算正确率
  const calculateAccuracy = (test) => {
    if (!test.totalWords) return 0;
    return Math.round((test.correctAnswers / test.totalWords) * 100);
  };
  
  // 根据级别获取颜色
  const getLevelColor = (level) => {
    const levelColors = {
      'beginner': 'info',
      'elementary': 'info',
      'intermediate': 'success',
      'upper_intermediate': 'success',
      'advanced': 'secondary',
      'proficient': 'warning'
    };
    return levelColors[level] || 'default';
  };
  
  // 渲染测试详情对话框
  const renderDetailDialog = () => {
    if (!selectedTest) return null;
    
    return (
      <Dialog 
        open={detailDialogOpen} 
        onClose={closeDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">测试详情</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            完成时间: {formatDate(selectedTest.completedAt)}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <LinearProgress sx={{ width: '80%', mb: 2 }} />
              <Typography>加载测试详情...</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {selectedTest.estimatedVocabulary.toLocaleString()} 词汇量
                </Typography>
                <Chip 
                  label={`水平: ${getLevelName(selectedTest.level)}`}
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
                        {calculateAccuracy(selectedTest)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" color="text.secondary">测试单词总数</Typography>
                      <Typography variant="h5">{selectedTest.totalWords}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {selectedTest.testWords && selectedTest.testWords.length > 0 ? (
                <TestResultChart test={selectedTest} />
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  无法显示详细的测试单词数据。由于技术限制，目前只能查看最新测试的完整数据。
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailDialog}>关闭</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/vocabulary-test', { state: { startNewTest: true } })}
          >
            开始新测试
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  if (loading && tests.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>词汇量测试历史</Typography>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>加载中...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">词汇量测试历史</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/vocabulary-test', { state: { startNewTest: true } })}
        >
          开始新测试
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {tests.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>暂无测试记录</Typography>
          <Typography variant="body1" gutterBottom>
            您尚未完成任何词汇量测试。开始一个新测试，了解您的词汇量水平！
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/vocabulary-test', { state: { startNewTest: true } })}
            sx={{ mt: 2 }}
          >
            开始测试
          </Button>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>测试日期</TableCell>
                  <TableCell>词汇量</TableCell>
                  <TableCell>词汇水平</TableCell>
                  <TableCell>正确率</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test._id} hover>
                    <TableCell>{formatDate(test.completedAt)}</TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {test.estimatedVocabulary.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getLevelName(test.level)} 
                        size="small" 
                        color={getLevelColor(test.level)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {calculateAccuracy(test)}%
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/vocabulary-test/${test._id}`)}
                      >
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={pagination.pages} 
                page={pagination.page} 
                onChange={handlePageChange} 
                color="primary"
              />
            </Box>
          )}
        </>
      )}
      
      {renderDetailDialog()}
    </Container>
  );
};

export default VocabularyTestHistoryPage; 