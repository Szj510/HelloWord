import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// MUI组件
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Fade from '@mui/material/Fade';

// 图标
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // 从 location state 中获取可能的 redirectUrl
    const from = location.state?.from?.pathname || "/home";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 调用后端登录接口
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || '登录失败');
            }

            const data = await response.json();
            await login(data.token); // 使用返回的 token 调用 login 方法

            // 登录成功后重定向到之前尝试访问的页面或者首页
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || '登录失败，请检查您的邮箱和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" className="animate-fade-in">
            <Fade in={true} timeout={800}>
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                    }}
                >
                    <Box
                        className="card-neumorphic"
                        sx={{
                            width: '100%',
                            borderRadius: '24px',
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar 
                            sx={{ 
                                m: 1, 
                                bgcolor: 'transparent',
                                background: 'linear-gradient(135deg, #4776E6, #8E54E9)',
                                width: 56,
                                height: 56,
                                boxShadow: '0 8px 16px rgba(142, 84, 233, 0.2)'
                            }}
                        >
                            <LockOutlinedIcon sx={{ color: 'white', fontSize: '28px' }} />
                        </Avatar>
                        <Typography 
                            component="h1" 
                            variant="h4" 
                            className="gradient-text"
                            sx={{ 
                                mt: 1, 
                                mb: 3, 
                                fontWeight: 'bold',
                            }}
                        >
                            用户登录
                        </Typography>

                        {error && (
                            <Alert 
                                severity="error" 
                                variant="filled" 
                                className="animate-fade-in"
                                sx={{ 
                                    width: '100%', 
                                    mb: 2,
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <Box 
                                sx={{ 
                                    position: 'relative',
                                    mb: 3,
                                    transition: 'transform 0.3s ease',
                                    transform: focusedField === 'email' ? 'translateY(-5px)' : 'none',
                                }}
                            >
                                <TextField
                                    className="input-neumorphic"
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="email"
                                    label="邮箱"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    InputProps={{
                                        startAdornment: (
                                            <EmailIcon 
                                                sx={{ 
                                                    mr: 1, 
                                                    color: focusedField === 'email' ? '#4776E6' : 'text.secondary'
                                                }} 
                                            />
                                        ),
                                        sx: {
                                            borderRadius: '12px',
                                        }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: 'rgba(0, 0, 0, 0.1)',
                                                borderRadius: '12px',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#4776E6',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#4776E6',
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            <Box 
                                sx={{ 
                                    position: 'relative',
                                    mb: 3,
                                    transition: 'transform 0.3s ease',
                                    transform: focusedField === 'password' ? 'translateY(-5px)' : 'none',
                                }}
                            >
                                <TextField
                                    className="input-neumorphic"
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="密码"
                                    type="password"
                                    id="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    InputProps={{
                                        startAdornment: (
                                            <VpnKeyIcon 
                                                sx={{ 
                                                    mr: 1, 
                                                    color: focusedField === 'password' ? '#4776E6' : 'text.secondary' 
                                                }} 
                                            />
                                        ),
                                        sx: {
                                            borderRadius: '12px',
                                        }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: 'rgba(0, 0, 0, 0.1)',
                                                borderRadius: '12px',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#4776E6',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#4776E6',
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 15px rgba(71, 118, 230, 0.25)',
                                    '&:hover': {
                                        boxShadow: '0 12px 20px rgba(71, 118, 230, 0.35)',
                                        transform: 'translateY(-3px)'
                                    },
                                    '&:active': {
                                        boxShadow: '0 5px 10px rgba(71, 118, 230, 0.2)',
                                        transform: 'translateY(0)'
                                    }
                                }}
                            >
                                {loading ? <div className="spinner" style={{ width: 24, height: 24 }} /> : '登录'}
                            </Button>

                            <Grid container sx={{ mt: 3 }}>
                                <Grid item xs>
                                    <Link 
                                        component={RouterLink} 
                                        to="/forgot-password" 
                                        variant="body2"
                                        sx={{
                                            color: '#4776E6',
                                            textDecoration: 'none',
                                            position: 'relative',
                                            '&:hover': {
                                                color: '#8E54E9'
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                width: '100%',
                                                height: '2px',
                                                bottom: '-2px',
                                                left: 0,
                                                background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                                transformOrigin: 'left',
                                                transform: 'scaleX(0)',
                                                transition: 'transform 0.3s ease'
                                            },
                                            '&:hover::after': {
                                                transform: 'scaleX(1)'
                                            }
                                        }}
                                    >
                                        忘记密码?
                                    </Link>
                                </Grid>
                                <Grid item>
                                    <Link 
                                        component={RouterLink} 
                                        to="/register" 
                                        variant="body2"
                                        sx={{
                                            color: '#4776E6',
                                            textDecoration: 'none',
                                            position: 'relative',
                                            '&:hover': {
                                                color: '#8E54E9'
                                            },
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                width: '100%',
                                                height: '2px',
                                                bottom: '-2px',
                                                left: 0,
                                                background: 'linear-gradient(90deg, #4776E6, #8E54E9)',
                                                transformOrigin: 'left',
                                                transform: 'scaleX(0)',
                                                transition: 'transform 0.3s ease'
                                            },
                                            '&:hover::after': {
                                                transform: 'scaleX(1)'
                                            }
                                        }}
                                    >
                                        {"没有账号? 立即注册"}
                                    </Link>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* 装饰元素 */}
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(71, 118, 230, 0.5), rgba(142, 84, 233, 0.5))',
                            filter: 'blur(40px)',
                            top: '-50px',
                            right: '-80px',
                            zIndex: -1,
                            animation: 'pulse 5s infinite ease-in-out'
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(142, 84, 233, 0.5), rgba(71, 118, 230, 0.5))',
                            filter: 'blur(40px)',
                            bottom: '-40px',
                            left: '-60px',
                            zIndex: -1,
                            animation: 'pulse 6s infinite ease-in-out'
                        }}
                    />
                </Box>
            </Fade>
        </Container>
    );
}

export default LoginPage;