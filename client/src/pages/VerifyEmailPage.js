import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

function VerifyEmailPage() {
  const { token } = useParams();
  const muiTheme = useTheme();
  const { colorScheme } = useAppTheme();
  
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
  
  useEffect(() => {
    // 直接跳转到后端验证API，使用完整URL包括协议和主机名
    window.location.href = `http://localhost:5001/api/auth/verify/${token}`;
  }, [token]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center', 
        minHeight: '80vh'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2,
          backgroundColor: muiTheme.palette.background.paper,
          width: { xs: '90%', sm: '450px' },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.secondary})`,
          }}
        />
        <CircularProgress sx={{ color: themeColors.accent }} />
        <Typography 
          variant="h6" 
          sx={{ 
            mt: 2,
            color: themeColors.text,
            fontWeight: 'medium'
          }}
        >
          正在验证您的邮箱，请稍候...
        </Typography>
      </Paper>
    </Box>
  );
}

export default VerifyEmailPage;