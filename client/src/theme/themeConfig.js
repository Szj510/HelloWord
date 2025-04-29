import { createTheme } from '@mui/material/styles';

// 定义亮色主题
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4776E6',
      light: '#8E54E9',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8E54E9',
      light: '#9C6EEE',
      contrastText: '#fff',
    },
    background: {
      default: '#f9f9f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
  },
});

// 定义暗色主题
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4776E6',
      light: '#8E54E9',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8E54E9',
      light: '#9C6EEE',
      contrastText: '#fff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          borderRadius: 12,
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 30, 30, 0.85)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});