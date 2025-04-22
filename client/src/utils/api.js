// 简单的 API 请求封装，自动添加 Token

const apiFetch = async (url, options = {}) => {
  // 1. 获取存储的 Token
  const token = localStorage.getItem('token');

  // 2. 准备请求头
  const headers = {
    'Content-Type': 'application/json', // 默认发送 JSON
    ...options.headers, // 合并传入的 headers (允许覆盖默认值)
  };

  // 3. 如果存在 Token，添加到 Authorization 头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. 准备完整的 fetch options
  const fetchOptions = {
    ...options, // 合并传入的 options (如 method, body 等)
    headers,    // 使用我们准备好的 headers
  };

  // 5. 发起 fetch 请求
  try {
    const response = await fetch(url, fetchOptions);

    // 6. 解析响应体 (尝试解析 JSON，如果失败则返回原始 response)
    let data;
    try {
      // 假设大多数 API 返回 JSON
      data = await response.json();
    } catch (error) {
      // 如果响应体不是有效的 JSON (例如 204 No Content)，则 data 为 undefined
      console.log('Response body is not JSON or empty.');
    }

    // 7. 处理 HTTP 错误状态码
    if (!response.ok) {
      // 如果后端返回了错误信息 (如 { msg: '...' })，则使用它
      // 否则，构造一个通用的错误信息
      const errorMessage = data?.msg || data?.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      error.response = response; // 可以将原始响应附加到错误对象上
      error.data = data;         // 也可以将解析的数据附加
      throw error;
    }

    // 8. 返回解析后的数据 (如果成功)
    return data;

  } catch (error) {
    console.error('API Fetch Error:', error);
    // 重新抛出错误，以便调用者可以捕获和处理
    throw error;
  }
};

export default apiFetch;