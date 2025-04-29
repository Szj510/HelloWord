import { createTheme } from '@mui/material/styles';

// 定义记忆模式的标记颜色（与配色无关的功能性颜色）
export const memoryColors = {
  // 专注记忆模式的标记颜色
  mainColor: '#F85D5D',      // 主色调 - 红色
  subColor: '#F8C35D',       // 次重点 - 橙色
  importantTerm: '#4BA4F9',  // 重点术语 - 蓝色
  translation: '#32CD32',    // 翻译 - 绿色
  keyNote: '#9F5CE4',        // 关键笔记 - 紫色
  workDict: '#9F6D60',       // 工作字典 - 棕色
  
  // 词性分类系统
  noun: '#F8C35D',           // 名词 - 黄色
  verb: '#4BA4F9',           // 动词 - 蓝色
  adj: '#32CD32',            // 形容词 - 绿色
  adv: '#9F5CE4',            // 副词 - 紫色
  prep: '#F85D5D',           // 介词 - 红色
  conj: '#9F6D60',           // 连词 - 棕色
  
  // 记忆层级可视化
  memoryLevel1: '#F85D5D',   // 记忆最浅
  memoryLevel2: '#F8C35D',
  memoryLevel3: '#32CD32',
  memoryLevel4: '#4BA4F9',
  memoryLevel5: '#9F5CE4',   // 记忆最深
};

// 【1】蓝灰色系配色方案
export const blueGrayColors = {
  primary: '#404859',       // 主色
  secondary: '#5B6C8C',     // 次色
  tertiary: '#6C7C99',      // 第三色
  light: '#EDF0F5',         // 浅色背景
  accent: '#3E4C63',        // 强调色
  text: '#242D3B',          // 文字色
  border: '#A9B6CB',        // 边框色
  hover: '#C7D0DF',         // 悬停色
  secondaryText: '#5A677D', // 次要文字色
  gradient: 'linear-gradient(90deg, #404859, #5B6C8C)', // 渐变
  boxShadow: '0 8px 20px rgba(64, 72, 89, 0.15)',       // 阴影
  // 色彩标识符（方便在CSS中引用）
  colors: {
    c1: '#404859',
    c2: '#5B6C8C',
    c3: '#6C7C99',
    c4: '#A9B6CB', 
    c5: '#3E4C63'
  }
};

// 【2】奶茶色系配色方案
export const earthToneColors = {
  primary: '#F9F5F0',    // 更淡的奶茶色（主色调，更接近白色）
  secondary: '#D2B48C',  // 深奶茶色
  tertiary: '#C4A484',   // 奶咖色
  light: '#FAF7F2',      // 更淡的燕麦白（背景色，更接近白色）
  accent: '#A67C52',     // 焦糖棕（强调色）
  text: '#3E2723',       // 深巧克力（文字色）
  border: '#D4BEA7',     // 边框色
  hover: '#E6D5C1',      // 悬停色
  secondaryText: '#5D4037', // 次要文字色
  gradient: 'linear-gradient(90deg, #A67C52, #C4A484)', // 渐变
  boxShadow: '0 8px 20px rgba(166, 124, 82, 0.15)',      // 阴影
  // 色彩标识符
  colors: {
    c1: '#A67C52',
    c2: '#C4A484',
    c3: '#D2B48C',
    c4: '#F9F5F0',
    c5: '#FAF7F2'
  }
};

// 【3】绿米色系配色方案
export const greenBeigeColors = {
  primary: '#EBF5EC',    // 更改为浅绿色背景
  secondary: '#6A8D6D',  // 草绿色
  tertiary: '#A0C1A3',   // 浅绿色
  light: '#F0F8F1',      // 更改为淡绿色背景
  accent: '#57744A',     // 深橄榄绿（强调色）
  text: '#253226',       // 深绿（文字色）
  border: '#B5C9B7',     // 边框色
  hover: '#D6E5D8',      // 悬停色
  secondaryText: '#3C5141', // 次要文字色
  gradient: 'linear-gradient(90deg, #6A8D6D, #A0C1A3)', // 渐变
  boxShadow: '0 8px 20px rgba(106, 141, 109, 0.15)',    // 阴影
  // 色彩标识符
  colors: {
    c1: '#57744A',
    c2: '#6A8D6D',
    c3: '#A0C1A3',
    c4: '#D6E5D8',
    c5: '#EBF5EC'
  }
};

// 创建基于特定配色的主题
function createAppTheme(colorSet) {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: colorSet.accent,
        light: colorSet.tertiary,
        contrastText: colorSet.light,
      },
      secondary: {
        main: colorSet.secondary,
        light: colorSet.tertiary,
        contrastText: colorSet.text,
      },
      background: {
        default: colorSet.light,
        paper: colorSet.primary,
      },
      text: {
        primary: colorSet.text,
        secondary: colorSet.secondaryText,
      },
      // 提供配色引用
      colorScheme: {
        ...colorSet
      },
      // 保留记忆模式颜色
      memory: {
        ...memoryColors
      }
    },
    typography: {
      fontFamily: '"PingFang SC", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
        color: colorSet.text,
      },
      h2: {
        fontWeight: 600,
        color: colorSet.text,
      },
      h3: {
        fontWeight: 600,
        color: colorSet.text,
      },
      h4: {
        fontWeight: 600,
        color: colorSet.text,
      },
      h5: {
        fontWeight: 600,
        color: colorSet.text,
      },
      h6: {
        fontWeight: 600,
        color: colorSet.text,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: colorSet.boxShadow,
            borderRadius: 12,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            // 不直接设置backgroundColor，而是添加一个类选择器
            // 这样我们可以在特定组件中覆盖默认背景色
            '&.MuiPaper-elevation0': {
              backgroundColor: 'inherit',  // 无阴影的Paper组件继承父元素背景色
            },
            '&.MuiPaper-elevation1, &.MuiPaper-elevation2, &.MuiPaper-elevation3': {
              backgroundColor: colorSet.primary, // 有阴影的Paper组件使用主题primary颜色
            }
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: `rgba(${hexToRgb(colorSet.accent)}, 0.1)`,
            color: colorSet.accent,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
          contained: {
            backgroundColor: colorSet.accent,
            '&:hover': {
              backgroundColor: colorSet.tertiary,
            },
          },
          outlined: {
            borderColor: colorSet.accent,
            color: colorSet.accent,
            '&:hover': {
              borderColor: colorSet.tertiary,
              backgroundColor: `rgba(${hexToRgb(colorSet.accent)}, 0.08)`,
            },
          },
          text: {
            color: colorSet.accent,
            '&:hover': {
              backgroundColor: `rgba(${hexToRgb(colorSet.accent)}, 0.08)`,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: colorSet.accent,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: `rgba(${hexToRgb(colorSet.accent)}, 0.2)`,
              },
              '&:hover fieldset': {
                borderColor: `rgba(${hexToRgb(colorSet.accent)}, 0.5)`,
              },
              '&.Mui-focused fieldset': {
                borderColor: colorSet.accent,
              },
            },
          },
        },
      },
    },
  });
}

// 辅助函数：将16进制颜色转换为RGB格式
function hexToRgb(hex) {
  // 移除可能的#前缀
  hex = hex.replace('#', '');
  
  // 将短格式转为长格式 如 #abc 转为 #aabbcc
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // 提取RGB值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

// 导出三种主题配置
export const blueGrayTheme = createAppTheme(blueGrayColors);
export const earthToneTheme = createAppTheme(earthToneColors);
export const greenBeigeTheme = createAppTheme(greenBeigeColors);

// 获取当前活跃的主题
export const getActiveTheme = (colorScheme) => {
  switch (colorScheme) {
    case 'blue-gray': 
      return blueGrayTheme;
    case 'earth-tone':
      return earthToneTheme;
    case 'green-beige':
      return greenBeigeTheme;
    default:
      return greenBeigeTheme; // 默认使用绿米色系
  }
};