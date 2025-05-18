import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#4caf50', '#ff5722'];

// 难度级别对应的中文名称
const DIFFICULTY_LEVELS = {
  beginner: '初级',
  elementary: '基础',
  intermediate: '中级',
  upper_intermediate: '中高级',
  advanced: '高级',
  proficient: '精通'
};

const TestResultChart = ({ test }) => {
  // 准备图表数据
  const chartData = useMemo(() => {
    if (!test) return [];
    
    return [
      { name: '正确', value: test.correctAnswers || 0 },
      { name: '错误', value: test.incorrectAnswers || 0 }
    ];
  }, [test]);
  
  // 按难度级别分析
  const difficultyAnalysis = useMemo(() => {
    if (!test || !test.testWords) return [];
    
    // 按难度对单词进行分组
    const difficultyGroups = {};
    
    // 初始化所有难度级别
    [1, 2, 3, 4, 5].forEach(difficulty => {
      difficultyGroups[difficulty] = {
        total: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0
      };
    });
    
    // 统计每个难度级别的结果
    test.testWords.forEach(word => {
      if (!word.difficulty) return;
      
      const difficulty = word.difficulty;
      difficultyGroups[difficulty].total += 1;
      
      if (word.isCorrect) {
        difficultyGroups[difficulty].correct += 1;
      } else {
        difficultyGroups[difficulty].incorrect += 1;
      }
    });
    
    // 计算每个难度级别的正确率
    Object.keys(difficultyGroups).forEach(difficulty => {
      const group = difficultyGroups[difficulty];
      if (group.total > 0) {
        group.accuracy = Math.round((group.correct / group.total) * 100);
      }
    });
    
    return difficultyGroups;
  }, [test]);
  
  if (!test) return null;
  
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>结果分析</Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          总体情况
        </Typography>
        
        <Box sx={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, '单词数']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          按难度级别分析
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.keys(difficultyAnalysis).map(difficulty => {
            const group = difficultyAnalysis[difficulty];
            if (group.total === 0) return null;
            
            return (
              <Box key={difficulty} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    难度 {difficulty} {getDifficultyName(difficulty)}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {group.accuracy}% 正确
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  width: '100%', 
                  height: '12px', 
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  <Box sx={{ 
                    width: `${group.accuracy}%`, 
                    bgcolor: getAccuracyColor(group.accuracy),
                    height: '100%'
                  }}/>
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  共 {group.total} 个单词，正确 {group.correct} 个
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

// 根据难度级别获取对应的名称
const getDifficultyName = (difficulty) => {
  const difficultyLevel = {
    1: '(初级)',
    2: '(基础)',
    3: '(中级)',
    4: '(高级)',
    5: '(精通)'
  };
  
  return difficultyLevel[difficulty] || '';
};

// 根据正确率获取颜色
const getAccuracyColor = (accuracy) => {
  if (accuracy >= 80) return '#4caf50'; // 绿色
  if (accuracy >= 60) return '#8bc34a'; // 淡绿色
  if (accuracy >= 40) return '#ffeb3b'; // 黄色
  if (accuracy >= 20) return '#ff9800'; // 橙色
  return '#f44336'; // 红色
};

export default TestResultChart; 