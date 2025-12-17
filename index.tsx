import React from 'react';
import ReactDOM from 'react-dom/client';
import RouterApp from './RouterApp';
import ToastProvider from './components/ToastProvider';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { muiTheme } from './theme/muiTheme';
import { AppProvider } from './context/AppContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppProvider>
        <ToastProvider>
          <RouterApp />
        </ToastProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);