import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Link 用于导航到登录页

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', // 如果需要用户名注册
    email: '',
    password: '',
    password2: '' // 添加确认密码字段
  });
  const [error, setError] = useState(''); // 用于显示后端返回的错误信息
  const [loading, setLoading] = useState(false); // 用于显示加载状态，防止重复提交
  const navigate = useNavigate(); // 用于注册成功后跳转

  const { username, email, password, password2 } = formData;

  // 处理表单输入变化
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // 清除之前的错误信息
  };

  // 处理表单提交
  const onSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为

    // 前端简单验证：检查密码是否匹配
    if (password !== password2) {
      setError('两次输入的密码不一致');
      return;
    }
    // 可以添加更多前端验证，如邮箱格式、密码强度等

    setLoading(true); // 开始请求，设置加载状态
    setError('');     // 清除之前的错误信息

    try {
      // 注意：这里假设注册只需要 email 和 password
      // 如果后端 /api/auth/register 需要 username，确保它包含在 body 中
      const registerData = { email, password };
      // 如果需要 username: const registerData = { username, email, password };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json(); // 解析响应体

      if (!response.ok) {
        // 如果响应状态码不是 2xx，认为是错误
        throw new Error(data.msg || `HTTP error! status: ${response.status}`);
      }

      // 注册成功
      console.log('注册成功:', data); // data 中应该包含 token
      // 提示用户注册成功，并跳转到登录页面
      alert('注册成功！请登录。'); // 简单的提示，可以替换为更友好的 UI 反馈
      navigate('/login'); // 跳转到登录页

    } catch (err) {
      console.error('注册请求失败:', err);
      // 设置错误信息以在 UI 中显示
      setError(err.message || '注册失败，请稍后重试。');
    } finally {
      setLoading(false); // 请求结束，取消加载状态
    }
  };

  return (
    <div>
      <h2>注册新账号</h2>
      <form onSubmit={onSubmit}>
        {/* 如果需要用户名
        <div>
          <label htmlFor="username">用户名:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={onChange}
          />
        </div>
        */}
        <div>
          <label htmlFor="email">邮箱:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            required // HTML5 简单验证
          />
        </div>
        <div>
          <label htmlFor="password">密码:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            required
            minLength="6" // HTML5 简单验证 - 建议与后端验证规则匹配
          />
        </div>
        <div>
          <label htmlFor="password2">确认密码:</label>
          <input
            type="password"
            id="password2"
            name="password2"
            value={password2}
            onChange={onChange}
            required
            minLength="6"
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>} {/* 显示错误信息 */}
        <button type="submit" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p>
        已经有账号了？ <Link to="/login">点此登录</Link>
      </p>
    </div>
  );
}

export default RegisterPage;