import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Fade from '@mui/material/Fade';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

function VerificationSuccessPage() {
    const { colorScheme } = useTheme();

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

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }} className="animate-fade-in">
            <Fade in={true} timeout={800}>
                <Paper
                    elevation={0}
                    className="card-neumorphic"
                    sx={{
                        p: 4,
                        borderRadius: '16px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.secondary})`,
                        }}
                    />
                    
                    <Box 
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 3,
                        }}
                    >
                        <CheckCircleIcon sx={{ 
                            fontSize: 64, 
                            color: '#32CD32',
                            filter: 'drop-shadow(0 4px 8px rgba(50, 205, 50, 0.3))',
                        }} />
                    </Box>
                    
                    <Typography 
                        variant="h4" 
                        component="h1"
                        sx={{ 
                            mb: 2, 
                            fontWeight: 'bold',
                            background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.secondary})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        邮箱验证成功！
                    </Typography>
                    
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            mb: 3, 
                            fontSize: '1.1rem',
                            color: themeColors.text,
                        }}
                    >
                        您的账号现已激活，可以登录 HelloWord 开始学习了。
                    </Typography>
                    
                    <Box 
                        sx={{ 
                            mt: 1, 
                            mb: 4, 
                            p: 2, 
                            bgcolor: `${themeColors.accent}10`, 
                            borderRadius: '12px',
                            border: `1px dashed ${themeColors.accent}30`
                        }}
                    >
                        <Typography variant="body2" sx={{ color: themeColors.secondaryText }}>
                            提示：此验证链接已使用，请勿重复点击邮件中的验证链接，否则会显示验证失败。
                        </Typography>
                    </Box>
                    
                    <Button
                        component={RouterLink}
                        to="/login"
                        variant="contained"
                        sx={{
                            borderRadius: '50px',
                            py: 1,
                            px: 4,
                            background: `linear-gradient(90deg, ${themeColors.accent}, ${themeColors.secondary})`,
                            boxShadow: `0 8px 16px ${themeColors.accent}30`,
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: `0 12px 20px ${themeColors.accent}40`,
                                transform: 'translateY(-3px)'
                            },
                        }}
                    >
                        前往登录
                    </Button>
                </Paper>
            </Fade>
        </Container>
    );
}

export default VerificationSuccessPage;