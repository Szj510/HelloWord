import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiFetch from '../utils/api'; // <--- 引入封装的 apiFetch

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 初始设为 false，待验证
  const [isLoading, setIsLoading] = useState(true); // 初始需要加载/验证
  const [user, setUser] = useState(null);

  // 使用 useCallback 包装获取用户信息的函数，避免在 useEffect 中重复创建
  const fetchUser = useCallback(async () => {
    console.log("Attempting to fetch user..."); // 调试信息
    // 仅在有 token 时尝试获取用户信息
    if (localStorage.getItem('token')) { // 直接检查 localStorage 中的 token
      try {
        // 使用封装的 apiFetch，它会自动带上 token
        const userData = await apiFetch('/api/users/me');
        console.log("User data fetched:", userData); // 调试信息
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('获取用户信息失败或 Token 无效:', error.message);
        // 如果获取用户信息失败（可能是 token 过期或无效），则执行登出逻辑
        logout(); // 清除无效 token 和状态
      }
    } else {
        // 没有 token，确保状态是未认证
        setIsAuthenticated(false);
        setUser(null);
    }
    setIsLoading(false); // 无论成功与否，加载状态结束
  }, []); // useCallback 的依赖为空数组，表示函数本身不会轻易改变

  // 在应用加载时尝试获取用户信息
  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // fetchUser 是依赖项

  // 登录函数
  const login = async (newToken) => { // 改为 async
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoading(true); // 开始加载用户信息
    // 登录成功后立即尝试获取用户信息
    await fetchUser(); // 等待用户信息获取完成
    // fetchUser 内部会设置 isAuthenticated 和 user，并结束 loading
  };

  // 退出登录函数
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    // 注意：如果需要，可以在这里添加 navigate('/login')，但通常组件中处理跳转更灵活
  };

  const value = {
    token,
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    fetchUser // 也可以暴露 fetchUser 供手动刷新用户信息
  };

  // 在初始加载完成前不渲染子组件，防止页面跳动或访问到旧状态
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};