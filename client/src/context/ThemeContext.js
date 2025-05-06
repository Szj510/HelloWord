import React, { createContext, useContext, useState, useEffect } from 'react';
import { getThemedMemoryColors } from '../theme/themeConfig';

// 定义三种配色方案（对应图片中的配色）
export const COLOR_SCHEMES = {
  BLUE_GRAY: 'blue-gray',    // 蓝灰色系
  EARTH_TONE: 'earth-tone',  // 大地色系（奶茶色）
  GREEN_BEIGE: 'green-beige' // 绿米色系
};

// 暗色和亮色模式
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark'
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // 从本地存储中获取配色方案，如果没有则默认为绿色系
  const [colorScheme, setColorScheme] = useState(() => {
    const savedColorScheme = localStorage.getItem('colorScheme');
    return savedColorScheme || COLOR_SCHEMES.GREEN_BEIGE; // 更改为默认使用绿色系
  });
  
  // 从本地存储中获取主题模式，如果没有则默认为亮色模式
  const [themeMode, setThemeMode] = useState(() => {
    const savedThemeMode = localStorage.getItem('themeMode');
    
    // 如果没有设置过，并且浏览器首选暗色模式，则使用暗色模式
    if (!savedThemeMode && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEME_MODES.DARK;
    }
    
    return savedThemeMode || THEME_MODES.LIGHT;
  });

  // 切换配色方案函数
  const changeColorScheme = (newScheme) => {
    if (Object.values(COLOR_SCHEMES).includes(newScheme)) {
      setColorScheme(newScheme);
      localStorage.setItem('colorScheme', newScheme);
    }
  };
  
  // 切换亮暗模式函数
  const toggleThemeMode = () => {
    const newMode = themeMode === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT;
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // 更新CSS变量助手函数
  const updateCssVariables = (scheme, mode) => {
    const memoryColors = getThemedMemoryColors(scheme);
    
    // 设置记忆颜色变量
    document.documentElement.style.setProperty('--memory-level-1', memoryColors.level1);
    document.documentElement.style.setProperty('--memory-level-2', memoryColors.level2);
    document.documentElement.style.setProperty('--memory-level-3', memoryColors.level3);
    document.documentElement.style.setProperty('--memory-level-4', memoryColors.level4);
    document.documentElement.style.setProperty('--memory-level-5', memoryColors.level5);
    
    // 设置用于渐变的颜色
    document.documentElement.style.setProperty('--memory-color-start', memoryColors.level1);
    document.documentElement.style.setProperty('--memory-color-end', memoryColors.level3);
    
    // 应用暗色模式设置
    document.documentElement.setAttribute('data-theme-mode', mode);
  };

  // 当配色方案改变时，更新文档的data-color-scheme属性和data-theme-mode属性
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    document.documentElement.setAttribute('data-theme-mode', themeMode);
    
    // 同时更新body元素的背景色，确保整个页面背景也随主题变化
    if (themeMode === THEME_MODES.LIGHT) {
      if (colorScheme === COLOR_SCHEMES.GREEN_BEIGE) {
        document.body.style.backgroundColor = '#F0F8F1'; // 绿色系背景
      } else if (colorScheme === COLOR_SCHEMES.BLUE_GRAY) {
        document.body.style.backgroundColor = '#EDF0F5'; // 蓝灰系背景
      } else {
        document.body.style.backgroundColor = '#FAF7F2'; // 奶茶色系背景
      }
    } else {
      // 暗色模式背景
      if (colorScheme === COLOR_SCHEMES.GREEN_BEIGE) {
        document.body.style.backgroundColor = '#1A2A1D'; // 绿色系暗背景
      } else if (colorScheme === COLOR_SCHEMES.BLUE_GRAY) {
        document.body.style.backgroundColor = '#1A1E26'; // 蓝灰系暗背景
      } else {
        document.body.style.backgroundColor = '#201A14'; // 奶茶色系暗背景
      }
    }
    
    // 更新CSS变量
    updateCssVariables(colorScheme, themeMode);
  }, [colorScheme, themeMode]);

  // 提供配色方案状态和切换函数
  return (
    <ThemeContext.Provider value={{ 
      colorScheme, 
      changeColorScheme, 
      COLOR_SCHEMES,
      themeMode,
      toggleThemeMode,
      THEME_MODES,
      isDarkMode: themeMode === THEME_MODES.DARK 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};