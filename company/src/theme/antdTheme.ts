import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorBgLayout: 'transparent',
    colorBorder: '#ebeef5',
    colorText: '#1d2129',
    colorTextSecondary: '#4e5969',
    borderRadius: 8,
    fontFamily:
      '"PingFang SC","Microsoft YaHei",-apple-system,Helvetica,Arial,sans-serif',
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 60,
      bodyBg: 'transparent',
    },
    Button: {
      controlHeight: 32,
    },
    Modal: {
      borderRadiusLG: 12,
    },
  },
};
