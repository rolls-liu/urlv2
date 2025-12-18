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
  Alert
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, ClearOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AggregatedPlayHistoryRecord, PlayProtocolType } from '../types';
import { getAggregatedPlayHistory, deleteAggregatedPlayHistoryRecord, clearAggregatedPlayHistory } from '../utils/storage';

const { Title, Text } = Typography;

interface PlayHistoryPanelProps {
  onBack: () => void;
}

const PlayHistoryPanel: React.FC<PlayHistoryPanelProps> = ({ onBack }) => {
  const [history, setHistory] = useState<AggregatedPlayHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AggregatedPlayHistoryRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 加载历史记录
  const loadHistory = () => {
    try {
      setLoading(true);
      const records = getAggregatedPlayHistory();
      setHistory(records);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      message.error('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadHistory();
  }, []);

  // 删除单条记录
  const handleDelete = (id: string) => {
    try {
      deleteAggregatedPlayHistoryRecord(id);
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
      clearAggregatedPlayHistory();
      setHistory([]);
      message.success('清空成功');
    } catch (error) {
      console.error('清空失败:', error);
      message.error('清空失败');
    }
  };

  // 查看详情
  const handleViewDetail = (record: AggregatedPlayHistoryRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

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

  // 获取协议标签颜色
  const getProtocolColor = (protocol: PlayProtocolType): string => {
    const colors: Record<PlayProtocolType, string> = {
      'RTMP': 'blue',
      'WebRTC': 'green',
      'FLV': 'orange',
      'M3U8': 'purple'
    };
    return colors[protocol] || 'default';
  };

  // 表格列配置
  const columns = [
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: AggregatedPlayHistoryRecord, b: AggregatedPlayHistoryRecord) => 
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend' as const
    },
    {
      title: '播放域名',
      dataIndex: ['config', 'domain'],
      key: 'domain',
      ellipsis: true
    },
    {
      title: 'AppName',
      dataIndex: ['config', 'appName'],
      key: 'appName',
      width: 120
    },
    {
      title: 'StreamName',
      dataIndex: ['config', 'streamName'],
      key: 'streamName',
      width: 150,
      ellipsis: true
    },
    {
      title: '加密类型',
      dataIndex: ['config', 'encryption'],
      key: 'encryption',
      width: 100,
      render: (encryption: string) => (
        <Tag color={encryption === 'MD5' ? 'blue' : 'purple'}>{encryption}</Tag>
      )
    },
    {
      title: '是否鉴权',
      key: 'hasAuth',
      width: 100,
      render: (record: AggregatedPlayHistoryRecord) => (
        <Tag color={record.config.key ? 'green' : 'default'}>
          {record.config.key ? '是' : '否'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: AggregatedPlayHistoryRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            详情
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                type="text"
              />
              <Title level={3} style={{ margin: 0 }}>播放地址历史记录</Title>
            </div>
            {history.length > 0 && (
              <Popconfirm
                title="确定要清空所有历史记录吗？"
                onConfirm={handleClearAll}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<ClearOutlined />}
                >
                  清空所有记录
                </Button>
              </Popconfirm>
            )}
          </div>
        }
      >
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              暂无播放地址历史记录
            </Text>
          </div>
        ) : (
          <Table
            dataSource={history}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
          />
        )}
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="播放地址详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedRecord && (
          <div>
            <Descriptions title="配置信息" bordered column={2} style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="播放域名">{selectedRecord.config.domain}</Descriptions.Item>
              <Descriptions.Item label="AppName">{selectedRecord.config.appName}</Descriptions.Item>
              <Descriptions.Item label="StreamName">{selectedRecord.config.streamName}</Descriptions.Item>
              <Descriptions.Item label="加密类型">
                <Tag color={selectedRecord.config.encryption === 'MD5' ? 'blue' : 'purple'}>
                  {selectedRecord.config.encryption}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="密钥">
                {selectedRecord.config.key || <Text type="secondary">未设置</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="过期时间">
                {selectedRecord.config.expireTime || <Text type="secondary">未设置</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>生成的播放地址</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {Object.entries(selectedRecord.generatedUrls).map(([protocol, url]) => (
                <Alert
                  key={protocol}
                  message={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        backgroundColor: getProtocolColor(protocol as PlayProtocolType), 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        {protocol}
                      </span>
                      <span>播放地址</span>
                    </div>
                  }
                  description={
                    <div>
                      <Text code style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                        {url}
                      </Text>
                      <br />
                      <Button
                        type="link"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(url)}
                        style={{ marginTop: '8px', padding: 0 }}
                      >
                        复制 {protocol} 地址
                      </Button>
                    </div>
                  }
                  type="info"
                  showIcon
                />
              ))}
              <div style={{ marginTop: '16px' }}>
                <Button
                  type="primary" 
                  onClick={() => {
                    const allUrls = Object.entries(selectedRecord.generatedUrls)
                      .map(([protocol, url]) => `${protocol}: ${url}`)
                      .join('\n\n');
                    handleCopy(allUrls);
                  }}
                  icon={<CopyOutlined />}
                >
                  复制所有地址
                </Button>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlayHistoryPanel;