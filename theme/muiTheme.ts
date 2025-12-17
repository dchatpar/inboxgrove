import { createTheme } from '@mui/material/styles';

// InboxGrove dark theme for MUI components
export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#a855f7', // purple-500
      light: '#c084fc',
      dark: '#9333ea',
    },
    success: {
      main: '#10b981', // emerald-500
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444', // red-500
    },
    warning: {
      main: '#f59e0b', // amber-500
    },
    info: {
      main: '#3b82f6', // blue-500
    },
    background: {
      default: '#0a0a0a',
      paper: '#1e293b', // slate-800
    },
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#94a3b8', // slate-400
    },
    divider: '#334155', // slate-700
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '0.75rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #334155',
        },
      },
    },
  },
});
