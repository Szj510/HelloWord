import React from 'react';
import { useSearchParams, useLocation, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

function VerificationFailedPage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const reason = searchParams.get('reason') || (location.state && location.state.reason);
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

    let message = "邮箱验证失败。";
    let subMessage = "";
    
    if (reason === 'invalid_or_expired') {
        message = "验证链接无效或已过期";
        subMessage = "请尝试重新注册或联系支持获取帮助。";
    } else if (reason === 'server_error') {
        message = "验证过程中发生服务器错误";
        subMessage = "请稍后重试或联系支持获取帮助。";
    } else if (reason === 'previous_failed') {
        message = "此验证链接无效";
        subMessage = "可能您已经使用过此链接，或链接已过期。如果您的账户已验证成功，请直接登录；否则请尝试重新注册。";
    }

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
                        <ErrorOutlineIcon sx={{ 
                            fontSize: 64, 
                            color: themeColors.accent,
                            filter: `drop-shadow(0 4px 8px ${themeColors.accent}40)`,
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
                        验证失败
                    </Typography>
                    
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            mb: 2, 
                            fontSize: '1.1rem',
                            color: themeColors.text,
                            fontWeight: 'medium',
                        }}
                    >
                        {message}
                    </Typography>
                    
                    {subMessage && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mb: 3, 
                                color: themeColors.secondaryText,
                            }}
                        >
                            {subMessage}
                        </Typography>
                    )}
                    
                    <Box 
                        sx={{ 
                            mt: 2, 
                            mb: 4, 
                            p: 2, 
                            bgcolor: `${themeColors.accent}10`, 
                            borderRadius: '12px',
                            border: `1px dashed ${themeColors.accent}30`
                        }}
                    >
                        <Typography variant="body2" sx={{ color: themeColors.secondaryText }}>
                            如果您已成功验证过账户，再次点击验证链接将显示失败。这是正常现象，每个验证链接只能使用一次。
                        </Typography>
                    </Box>
                    
                    <Stack 
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                    >
                        <Button
                            component={RouterLink}
                            to="/login"
                            variant="outlined"
                            sx={{
                                borderRadius: '50px',
                                py: 1,
                                px: 3,
                                borderColor: themeColors.accent,
                                color: themeColors.accent,
                                fontWeight: 'medium',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: themeColors.secondary,
                                    backgroundColor: `${themeColors.accent}08`,
                                    transform: 'translateY(-2px)'
                                },
                            }}
                        >
                            返回登录
                        </Button>
                        
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            sx={{
                                borderRadius: '50px',
                                py: 1,
                                px: 3,
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
                            重新注册
                        </Button>
                    </Stack>
                </Paper>
            </Fade>
        </Container>
    );
}

export default VerificationFailedPage;