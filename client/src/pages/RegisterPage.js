import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../utils/api';

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
import Slide from '@mui/material/Slide';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// 图标
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const navigate = useNavigate();

    const { username, email, password, confirmPassword } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 简单的表单验证
        if (password !== confirmPassword) {
            setError('两次输入的密码不匹配');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // 调用注册API
            const response = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password 
                }),
            });
            
            // 设置成功消息，显示验证邮件提示
            setSuccess(true);
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
            });
            
            // 可选: 在一段时间后自动跳转到登录页
            // setTimeout(() => navigate('/login'), 5000);
        } catch (err) {
            setError(err.message || '注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" className="animate-fade-in">
            <Fade in={true} timeout={800}>
                <Box
                    sx={{
                        marginTop: 6,
                        marginBottom: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                    }}
                >
                    {success ? (
                        <Slide direction="up" in={success} mountOnEnter unmountOnExit>
                            <Box
                                className="card-glass"
                                sx={{
                                    width: '100%',
                                    borderRadius: '24px',
                                    p: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: 'rgba(255, 255, 255, 0.4)',
                                    backdropFilter: 'blur(15px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 12px 30px rgba(71, 118, 230, 0.1)'
                                }}
                            >
                                <Avatar 
                                    sx={{ 
                                        m: 1, 
                                        bgcolor: '#4caf50',
                                        width: 70,
                                        height: 70,
                                        boxShadow: '0 8px 16px rgba(76, 175, 80, 0.2)'
                                    }}
                                >
                                    <CheckCircleIcon sx={{ color: 'white', fontSize: '40px' }} />
                                </Avatar>

                                <Typography 
                                    component="h1" 
                                    variant="h4" 
                                    className="gradient-text"
                                    sx={{ 
                                        mt: 2, 
                                        mb: 1,
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                    }}
                                >
                                    注册成功！
                                </Typography>

                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        my: 2, 
                                        textAlign: 'center',
                                        fontSize: '1.1rem',
                                        color: '#555'
                                    }}
                                >
                                    我们已经向您的邮箱 {email} 发送了一封验证邮件，请检查邮箱并点击验证链接完成注册。
                                </Typography>

                                <Button
                                    component={RouterLink}
                                    to="/login"
                                    fullWidth
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
                                    前往登录页面
                                </Button>
                            </Box>
                        </Slide>
                    ) : (
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
                                <PersonAddIcon sx={{ color: 'white', fontSize: '28px' }} />
                            </Avatar>

                            <Typography 
                                component="h1" 
                                variant="h4" 
                                className="gradient-text"
                                sx={{ 
                                    mt: 1, 
                                    mb: 3, 
                                    fontWeight: 'bold'
                                }}
                            >
                                创建账号
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
                                        mb: 2,
                                        transition: 'transform 0.3s ease',
                                        transform: focusedField === 'username' ? 'translateY(-5px)' : 'none',
                                    }}
                                >
                                    <TextField
                                        className="input-neumorphic"
                                        variant="outlined"
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="username"
                                        label="用户名"
                                        name="username"
                                        autoComplete="username"
                                        value={username}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <PersonIcon 
                                                    sx={{ 
                                                        mr: 1, 
                                                        color: focusedField === 'username' ? '#4776E6' : 'text.secondary'
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
                                        mb: 2,
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
                                        label="邮箱地址"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <AlternateEmailIcon 
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
                                        mb: 2,
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
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <LockIcon 
                                                    sx={{ 
                                                        mr: 1, 
                                                        color: focusedField === 'password' ? '#4776E6' : 'text.secondary'
                                                    }} 
                                                />
                                            ),
                                            endAdornment: (
                                                <Box 
                                                    onClick={toggleShowPassword}
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        color: 'text.secondary',
                                                        '&:hover': {
                                                            color: '#4776E6',
                                                        },
                                                    }}
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </Box>
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
                                        mb: 2,
                                        transition: 'transform 0.3s ease',
                                        transform: focusedField === 'confirmPassword' ? 'translateY(-5px)' : 'none',
                                    }}
                                >
                                    <TextField
                                        className="input-neumorphic"
                                        variant="outlined"
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="confirmPassword"
                                        label="确认密码"
                                        type={showPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                        InputProps={{
                                            startAdornment: (
                                                <LockIcon 
                                                    sx={{ 
                                                        mr: 1, 
                                                        color: focusedField === 'confirmPassword' ? '#4776E6' : 'text.secondary'
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
                                        error={password !== confirmPassword && confirmPassword !== ''}
                                        helperText={password !== confirmPassword && confirmPassword !== '' ? '密码不匹配' : ''}
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
                                    {loading ? <div className="spinner" style={{ width: 24, height: 24 }} /> : '注册'}
                                </Button>

                                <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                                    <Grid item>
                                        <Link 
                                            component={RouterLink} 
                                            to="/login" 
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
                                            已有账号? 去登录
                                        </Link>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    )}

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

export default RegisterPage;