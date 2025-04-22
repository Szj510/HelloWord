import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- 引入 useAuth
import CircularProgress from '@mui/material/CircularProgress'; // 引入 MUI 加载指示器
import Box from '@mui/material/Box'; // 用于居中显示加载指示器

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth(); // <--- 使用 Context 获取状态

  if (isLoading) {
    // 如果正在加载认证状态，显示加载指示器
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 加载完成，根据认证状态决定渲染或重定向
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;