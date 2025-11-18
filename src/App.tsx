import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import StreamUrlGenerator from './components/StreamUrlGenerator';
import HistoryPanel from './components/HistoryPanel';
import './App.css';

type ViewType = 'generator' | 'history';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('generator');

  const handleShowHistory = () => {
    setCurrentView('history');
  };

  const handleBackToGenerator = () => {
    setCurrentView('generator');
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        {currentView === 'generator' ? (
          <StreamUrlGenerator onHistoryClick={handleShowHistory} />
        ) : (
          <HistoryPanel onBack={handleBackToGenerator} />
        )}
      </div>
    </ConfigProvider>
  );
};

export default App;