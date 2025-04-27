import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
// import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

function VerificationSuccessPage() {
    return (
        <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
            <Alert severity="success" /*icon={<CheckCircleOutlineIcon fontSize="inherit" />}*/>
                <Typography variant="h5" gutterBottom>邮箱验证成功！</Typography>
            </Alert>
            <Typography sx={{ mt: 2, mb: 2 }}>
                您的账号现已激活，可以登录 HelloWord 开始学习了。
            </Typography>
            <Box sx={{ mt: 1, mb: 3, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    提示：此验证链接已使用，请勿重复点击邮件中的验证链接，否则会显示验证失败。
                </Typography>
            </Box>
            <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
            >
                前往登录
            </Button>
        </Container>
    );
}

export default VerificationSuccessPage;