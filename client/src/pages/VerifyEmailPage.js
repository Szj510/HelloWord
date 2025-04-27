import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function VerifyEmailPage() {
  const { token } = useParams();
  
  useEffect(() => {
    // 直接跳转到后端验证API，使用完整URL包括协议和主机名
    window.location.href = `http://localhost:5001/api/auth/verify/${token}`;
  }, [token]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        正在验证您的邮箱，请稍候...
      </Typography>
    </Box>
  );
}

export default VerifyEmailPage;