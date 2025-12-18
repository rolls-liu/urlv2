import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Typography,
  Popconfirm,
  Tag,
  Modal,
  Descriptions,
  Empty
} from 'antd';
import { ArrowLeftOutlined, CopyOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AggregatedHistoryRecord, ProtocolType } from '../types';
import { getAggregatedHistory, deleteAggregatedHistoryRecord, clearAggregatedHistory } from '../utils/storage';

const { Title, Text } = Typography;

interface HistoryPanelProps {
  onBack: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onBack }) => {
  const [history, setHistory] = useState<AggregatedHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AggregatedHistoryRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 加载历史记录
  const loadHistory = () => {
    setLoading(true);
    try {
      const records = getAggregatedHistory();
      setHistory(records);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      message.error('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // 复制到剪贴板（兼容非HTTPS环境）
  const handleCopy = async (text: string) => {
    // 方案1：使用 Clipboard API（HTTPS 环境）
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        message.success('已复制到剪贴板');
        return;
      } catch (e) {
        console.warn('Clipboard API 失败，尝试备用方案');
      }
    }
    
    // 方案2：使用 execCommand（兼容旧浏览器和非HTTPS）
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.style.zIndex = '-1';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      textArea.remove();
      if (successful) {
        message.success('已复制到剪贴板');
      } else {
        message.info('请手动复制：Ctrl+C / Cmd+C');
      }
    } catch (err) {
      textArea.remove();
      console.error('复制失败:', err);
      message.info('请手动复制：Ctrl+C / Cmd+C');
    }
  };

  // 删除单条记录
  const handleDelete = (id: string) => {
    try {
      deleteAggregatedHistoryRecord(id);
      setHistory(prev => prev.filter(record => record.id !== id));
      message.success('删除成功');
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 清空所有记录
  const handleClearAll = () => {
    try {
      clearAggregatedHistory();
      setHistory([]);
      message.success('清空成功');
    } catch (error) {
      console.error('清空失败:', error);
      message.error('清空失败');
    }
  };

  // 查看详情
  const handleViewDetail = (record: AggregatedHistoryRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  // 获取协议标签颜色
  const getProtocolColor = (protocol: ProtocolType): string => {
    const colors: Record<ProtocolType, string> = {
      'RTMP': 'blue',
      'WebRTC': 'green',
      'SRT': 'orange',
      'RTMP_OVER_SRT': 'purple',
      'RTMP_OVER_QUIC': 'red'
    };
    return colors[protocol] || 'default';
  };

  // 获取协议显示名称
  const getProtocolDisplayName = (protocol: ProtocolType): string => {
    const names: Record<ProtocolType, string> = {
      'RTMP': 'RTMP',
      'WebRTC': 'WebRTC',
      'SRT': 'SRT', 
      'RTMP_OVER_SRT': 'RTMP/SRT',
      'RTMP_OVER_QUIC': 'RTMP/QUIC'
    };
    return names[protocol];
  };

  // 表格列定义
  const columns = [
    {
      title: '域名',
      dataIndex: ['config', 'domain'],
      key: 'domain',
      width: 150,
      ellipsis: true
    },
    {
      title: 'AppName',
      dataIndex: ['config', 'appName'],
      key: 'appName',
      width: 100
    },
    {
      title: 'StreamName',
      dataIndex: ['config', 'streamName'],
      key: 'streamName',
      width: 120,
      ellipsis: true
    },
    {
      title: '加密方式',
      dataIndex: ['config', 'encryption'],
      key: 'encryption',
      width: 80,
      render: (encryption: string) => (
        <Tag color={encryption === 'MD5' ? 'cyan' : 'geekblue'}>
          {encryption}
        </Tag>
      )
    },
    {
      title: '协议数量',
      key: 'protocolCount',
      width: 80,
      render: (record: AggregatedHistoryRecord) => (
        <Tag color="blue">{Object.keys(record.generatedUrls).length} 个</Tag>
      )
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: string) => dayjs(createdAt).format('MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: AggregatedHistoryRecord) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            title="查看详情"
          />
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              const allUrls = Object.entries(record.generatedUrls)
                .map(([protocol, url]) => `${getProtocolDisplayName(protocol as ProtocolType)}: ${url}`)
                .join('\n\n');
              handleCopy(allUrls);
            }}
            title="复制所有地址"
          />
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="删除记录"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                style={{ marginRight: '8px' }}
              />
              <Title level={3} style={{ margin: 0 }}>历史记录</Title>
            </div>
            {history.length > 0 && (
              <Popconfirm
                title="确定要清空所有历史记录吗？"
                onConfirm={handleClearAll}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>清空全部</Button>
              </Popconfirm>
            )}
          </div>
        }
      >
        {history.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <Table
            columns={columns}
            dataSource={history}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <Modal
        title="记录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button 
            key="copy" 
            onClick={() => {
              if (selectedRecord) {
                const allUrls = Object.entries(selectedRecord.generatedUrls)
                  .map(([protocol, url]) => `${getProtocolDisplayName(protocol as ProtocolType)}: ${url}`)
                  .join('\n\n');
                handleCopy(allUrls);
              }
            }}
          >
            复制所有地址
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="加密方式">
                <Tag color={selectedRecord.config.encryption === 'MD5' ? 'cyan' : 'geekblue'}>
                  {selectedRecord.config.encryption}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="推流域名">
                {selectedRecord.config.domain}
              </Descriptions.Item>
              <Descriptions.Item label="AppName">
                {selectedRecord.config.appName}
              </Descriptions.Item>
              <Descriptions.Item label="StreamName">
                {selectedRecord.config.streamName}
              </Descriptions.Item>
              <Descriptions.Item label="密钥">
                {selectedRecord.config.key || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="过期时间" span={2}>
                {selectedRecord.config.expireTime || '未设置'}
              </Descriptions.Item>
            </Descriptions>
            
            <Title level={5}>所有协议推流地址</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {Object.entries(selectedRecord.generatedUrls).map(([protocol, url]) => (
                <div key={protocol} style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  padding: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <Tag color={getProtocolColor(protocol as ProtocolType)}>
                      {getProtocolDisplayName(protocol as ProtocolType)}
                    </Tag>
                    <Button
                      type="link"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(url)}
                    >
                      复制
                    </Button>
                  </div>
                  <Text code style={{ 
                    wordBreak: 'break-all', 
                    fontSize: '12px',
                    display: 'block',
                    backgroundColor: 'white',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    {url}
                  </Text>
                </div>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistoryPanel;