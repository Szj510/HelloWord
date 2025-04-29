import React, { createContext, useContext, useState, useEffect } from 'react';

// 定义三种配色方案（对应图片中的配色）
export const COLOR_SCHEMES = {
  BLUE_GRAY: 'blue-gray',    // 蓝灰色系
  EARTH_TONE: 'earth-tone',  // 大地色系（奶茶色）
  GREEN_BEIGE: 'green-beige' // 绿米色系
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 从本地存储中获取配色方案，如果没有则默认为绿色系
  const [colorScheme, setColorScheme] = useState(() => {
    const savedColorScheme = localStorage.getItem('colorScheme');
    return savedColorScheme || COLOR_SCHEMES.GREEN_BEIGE; // 更改为默认使用绿色系
  });

  // 切换配色方案函数
  const changeColorScheme = (newScheme) => {
    if (Object.values(COLOR_SCHEMES).includes(newScheme)) {
      setColorScheme(newScheme);
      localStorage.setItem('colorScheme', newScheme);
    }
  };

  // 当配色方案改变时，更新文档的data-color-scheme属性
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    // 同时更新body元素的背景色，确保整个页面背景也随主题变化
    const rootStyles = getComputedStyle(document.documentElement);
    if (colorScheme === COLOR_SCHEMES.GREEN_BEIGE) {
      document.body.style.backgroundColor = '#F0F8F1'; // 绿色系背景
    } else if (colorScheme === COLOR_SCHEMES.BLUE_GRAY) {
      document.body.style.backgroundColor = '#EDF0F5'; // 蓝灰系背景
    } else {
      document.body.style.backgroundColor = '#FAF7F2'; // 奶茶色系背景
    }
  }, [colorScheme]);

  // 提供配色方案状态和切换函数
  return (
    <ThemeContext.Provider value={{ colorScheme, changeColorScheme, COLOR_SCHEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};