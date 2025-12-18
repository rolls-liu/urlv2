import React, { useState, useEffect } from 'react';
import { ConfigProvider, Menu, Layout, Spin } from 'antd';
import { PlayCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import StreamUrlGenerator from './components/StreamUrlGenerator';
import PlayUrlGenerator from './components/PlayUrlGenerator';
import HistoryPanel from './components/HistoryPanel';
import PlayHistoryPanel from './components/PlayHistoryPanel';
import { initializeStorage } from './utils/storage';
import './App.css';

const { Header, Content } = Layout;

type ViewType = 'stream-generator' | 'play-generator' | 'stream-history' | 'play-history';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('stream-generator');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化存储，从服务器加载数据
    initializeStorage()
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, []);

  const handleShowStreamHistory = () => {
    setCurrentView('stream-history');
  };

  const handleShowPlayHistory = () => {
    setCurrentView('play-history');
  };

  const handleBackToStreamGenerator = () => {
    setCurrentView('stream-generator');
  };

  const handleBackToPlayGenerator = () => {
    setCurrentView('play-generator');
  };

  const handleMenuClick = (key: string) => {
    setCurrentView(key as ViewType);
  };

  const menuItems = [
    {
      key: 'stream-generator',
      icon: <VideoCameraOutlined />,
      label: '推流地址生成器'
    },
    {
      key: 'play-generator',
      icon: <PlayCircleOutlined />,
      label: '播放地址生成器'
    }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'stream-generator':
        return <StreamUrlGenerator onHistoryClick={handleShowStreamHistory} />;
      case 'play-generator':
        return <PlayUrlGenerator onHistoryClick={handleShowPlayHistory} />;
      case 'stream-history':
        return <HistoryPanel onBack={handleBackToStreamGenerator} />;
      case 'play-history':
        return <PlayHistoryPanel onBack={handleBackToPlayGenerator} />;
      default:
        return <StreamUrlGenerator onHistoryClick={handleShowStreamHistory} />;
    }
  };

  const showMenu = currentView === 'stream-generator' || currentView === 'play-generator';

  if (isLoading) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <Layout className="App" style={{ minHeight: '100vh' }}>
        {showMenu && (
          <Header style={{ padding: 0, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
              <Menu
                mode="horizontal"
                selectedKeys={[currentView]}
                items={menuItems}
                onClick={({ key }) => handleMenuClick(key)}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>
          </Header>
        )}
        <Content style={{ background: '#f5f5f5' }}>
          {renderCurrentView()}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;