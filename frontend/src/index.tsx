import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import ruRU from 'antd/locale/ru_RU';
import App from './components/App';
import { AuthProvider } from './auth/AuthContext';
import internetFavicon from './assets/internet-favicon.svg';
import './styles.scss';

const setFavicon = () => {
  const link = document.querySelector("link[rel='icon']") || document.createElement('link');
  link.setAttribute('rel', 'icon');
  link.setAttribute('type', 'image/svg+xml');
  link.setAttribute('href', internetFavicon);
  document.head.appendChild(link);
};

const root = document.getElementById('root') as HTMLDivElement;
setFavicon();

// Сбер-стиль тема
const sberTheme = {
  token: {
    colorPrimary: '#2E6B47',
    colorSuccess: '#2E6B47',
    colorWarning: '#FFB347',
    colorError: '#EF4444',
    colorInfo: '#1677ff',
    colorTextBase: '#1F2937',
    colorTextSecondary: '#6B7280',
    borderRadius: 12,
    borderRadiusLG: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeXL: 20,
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
    boxShadowSecondary: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
  components: {
    Card: {
      headerBg: 'transparent',
      borderRadiusLG: 16,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    },
    Layout: {
      bodyBg: '#F8FAFE',
      headerBg: '#FFFFFF',
      headerHeight: 64,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      fontWeight: 500,
    },
    Table: {
      headerBg: '#F9FAFB',
      rowHoverBg: '#F3F4F6',
      borderRadius: 12,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Tabs: {
      inkBarColor: '#2E6B47',
      itemSelectedColor: '#2E6B47',
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 28,
    },
  },
};

ReactDOM.createRoot(root).render(
  <ConfigProvider theme={sberTheme} locale={ruRU}>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ConfigProvider>
);
