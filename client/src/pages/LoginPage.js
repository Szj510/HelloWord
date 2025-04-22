import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  // 处理表单输入变化
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // 清除错误
  };

  // 处理表单提交
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // 发送 email 和 password
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || `HTTP error! status: ${response.status}`);
      }

      // 登录成功
      console.log('登录成功:', data); // data 中应该包含 token

      // *** 重要: 存储 Token ***
      // 将后端返回的 token 存储在 localStorage 中，以便后续请求使用
      // localStorage 中的数据在浏览器关闭后仍然存在
      login(data.token);

      // *** 注意：更新全局状态 ***
      // 在实际应用中，这里还需要更新一个全局的状态（例如通过 Context API 或 Redux）
      // 来表明用户已登录，以便应用的其他部分能够响应（例如显示用户名、保护路由等）
      // 目前我们先只做跳转

      // 跳转到主页或仪表盘页面
      navigate('/home'); // 跳转到 /home 路由

    } catch (err) {
      console.error('登录请求失败:', err);
      setError(err.message || '登录失败，请检查邮箱和密码。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>用户登录</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="email">邮箱:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            required
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
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p>
        还没有账号？ <Link to="/register">点此注册</Link>
      </p>
    </div>
  );
}

export default LoginPage;