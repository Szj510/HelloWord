import React from 'react';
import { useSearchParams, useLocation, Link as RouterLink } from 'react-router-dom'; // 增加useLocation
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
// import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline;

function VerificationFailedPage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const reason = searchParams.get('reason') || (location.state && location.state.reason);

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
        <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
            <Alert severity="error" /*icon={<ErrorOutlineIcon fontSize="inherit" />}*/>
                <Typography variant="h5" gutterBottom>验证失败</Typography>
            </Alert>
            <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body1" gutterBottom>
                    {message}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {subMessage}
                </Typography>
            </Box>
            <Box sx={{ mt: 3, mb: 3, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    如果您已成功验证过账户，再次点击验证链接将显示失败。这是正常现象，每个验证链接只能使用一次。
                </Typography>
            </Box>
            <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="primary"
                sx={{ mr: 2 }}
            >
                返回登录
            </Button>
            <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                color="primary"
            >
                重新注册
            </Button>
        </Container>
    );
}

export default VerificationFailedPage;