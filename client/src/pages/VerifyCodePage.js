import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Container, TextField, Button, Typography, 
    Alert, Paper, Avatar, CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import apiFetch from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { COLOR_SCHEMES } from '../context/ThemeContext';
import { earthToneColors, blueGrayColors, greenBeigeColors } from '../theme/themeConfig';

function VerifyCodePage() {
    const [verificationCode, setVerificationCode] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const muiTheme = useMuiTheme();
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

    // 从 location.state 或 URL 参数中获取邮箱地址
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const emailParam = urlParams.get('email');
        const stateEmail = location.state?.email;

        if (stateEmail) {
            setEmail(stateEmail);
        } else if (emailParam) {
            setEmail(emailParam);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!verificationCode.trim()) {
            setError('请输入验证码');
            return;
        }

        if (!email) {
            setError('无法确定邮箱地址，请重新注册');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const response = await apiFetch('/api/auth/verify-code', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    verificationCode
                }),
            });

            setSuccess(true);
            // 3秒后跳转到登录页面
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || '验证失败，请检查验证码是否正确');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            setError('无法确定邮箱地址，请重新注册');
            return;
        }

        setResendLoading(true);
        setError('');

        try {
            const response = await apiFetch('/api/auth/resend-verification', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });

            setResendSuccess(true);
            // 5秒后重置状态
            setTimeout(() => {
                setResendSuccess(false);
            }, 5000);
        } catch (err) {
            setError(err.message || '重新发送验证码失败，请稍后再试');
        } finally {
            setResendLoading(false);
        }
    };

    if (success) {
        return (
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        mt: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}
                >
                    <Avatar
                        sx={{
                            m: 1,
                            bgcolor: themeColors.accent,
                            width: 60,
                            height: 60
                        }}
                    >
                        <MarkEmailReadIcon sx={{ fontSize: 40, color: themeColors.light }} />
                    </Avatar>
                    <Typography component="h1" variant="h5" sx={{ mt: 2, color: themeColors.text }}>
                        邮箱验证成功！
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, color: themeColors.secondaryText }}>
                        您的账号已经成功激活，正在跳转到登录页面...
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/login"
                        variant="contained"
                        sx={{ 
                            mt: 3,
                            bgcolor: themeColors.accent,
                            color: themeColors.light,
                            '&:hover': { bgcolor: themeColors.secondary }
                        }}
                    >
                        立即登录
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    mt: 8,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 2,
                    backgroundColor: muiTheme.palette.background.paper,
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
                <Avatar sx={{ 
                    m: 1, 
                    bgcolor: themeColors.accent 
                }}>
                    <LockOutlinedIcon sx={{ color: themeColors.light }} />
                </Avatar>
                <Typography component="h1" variant="h5" sx={{ color: themeColors.text }}>
                    验证您的邮箱
                </Typography>

                <Box sx={{ mt: 1, width: '100%' }}>
                    {email && (
                        <Typography variant="body2" sx={{ mb: 2, color: themeColors.secondaryText }}>
                            验证码已发送至: <strong>{email}</strong>
                        </Typography>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {resendSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            新的验证码已发送至您的邮箱
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="verificationCode"
                            label="验证码"
                            name="verificationCode"
                            autoFocus
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            inputProps={{ maxLength: 6 }}
                            placeholder="请输入6位数字验证码"
                            disabled={isLoading}
                            InputLabelProps={{ 
                                sx: { color: themeColors.secondaryText } 
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: themeColors.border,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: themeColors.secondary,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: themeColors.accent,
                                    }
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ 
                                mt: 3, 
                                mb: 2,
                                bgcolor: themeColors.accent,
                                color: themeColors.light,
                                '&:hover': { bgcolor: themeColors.secondary }
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} sx={{ color: themeColors.light }} /> : '验证邮箱'}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: themeColors.secondaryText }}>
                            没有收到验证码？
                        </Typography>
                        <Button
                            onClick={handleResendCode}
                            disabled={resendLoading}
                            size="small"
                            sx={{ 
                                ml: 1,
                                color: themeColors.accent
                            }}
                        >
                            {resendLoading ? <CircularProgress size={16} sx={{ color: themeColors.accent }} /> : '重新发送'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default VerifyCodePage;