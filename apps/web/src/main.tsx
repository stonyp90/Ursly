import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './auth';
import { UserProvider, RealtimeProvider, ThemeProvider as AppThemeProvider } from './contexts';
import { theme } from './theme';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppThemeProvider>
            <UserProvider>
              <RealtimeProvider>
                <App />
              </RealtimeProvider>
            </UserProvider>
          </AppThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </MuiThemeProvider>
  </React.StrictMode>
);
