import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  message,
  Typography,
  Row,
  Col,
  Divider,
  DatePicker,
  Alert,
  Tag,
  AutoComplete
} from 'antd';
import { CopyOutlined, ClearOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { StreamConfig, ProtocolType, EncryptionType, AllProtocolUrls } from '../types';
import { generateAllProtocolUrls, validateStreamConfig } from '../utils/urlGenerator';
import { saveLastConfig, getLastConfig, saveAggregatedHistoryRecord, getHistoryInputValues } from '../utils/storage';

dayjs.extend(utc);

const { Title, Text } = Typography;
const { Option } = Select;

interface StreamUrlGeneratorProps {
  onHistoryClick: () => void;
}

const StreamUrlGenerator: React.FC<StreamUrlGeneratorProps> = ({ onHistoryClick }) => {
  const [form] = Form.useForm();
  const [generatedUrls, setGeneratedUrls] = useState<AllProtocolUrls | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyInputs, setHistoryInputs] = useState<{
    domains: string[];
    appNames: string[];
    streamNames: string[];
    keys: string[];
  }>({
    domains: [],
    appNames: [],
    streamNames: [],
    keys: []
  });



  // 加密类型选项
  const encryptionOptions: { value: EncryptionType; label: string }[] = [
    { value: 'MD5', label: 'MD5' },
    { value: 'SHA256', label: 'SHA256' }
  ];

  // 初始化表单数据和历史输入值
  useEffect(() => {
    try {
      // 加载历史输入值
      const historyValues = getHistoryInputValues();
      setHistoryInputs(historyValues);

      // 加载最后一次配置
      const lastConfig = getLastConfig();
      if (lastConfig) {
        const formValues: any = {
          ...lastConfig
        };
        
        // 安全地处理过期时间
        if (lastConfig.expireTime) {
          try {
            formValues.expireTime = dayjs(lastConfig.expireTime + ' UTC');
          } catch (error) {
            console.warn('解析过期时间失败:', error);
            formValues.expireTime = dayjs().add(1, 'day');
          }
        }
        
        form.setFieldsValue(formValues);
      } else {
        // 设置默认值
        form.setFieldsValue({
          encryption: 'MD5',
          appName: 'live',
          expireTime: dayjs().add(1, 'day')
        });
      }
    } catch (error) {
      console.error('初始化失败:', error);
      // 设置默认值作为后备
      form.setFieldsValue({
        encryption: 'MD5',
        appName: 'live',
        expireTime: dayjs().add(1, 'day')
      });
      setHistoryInputs({
        domains: [],
        appNames: [],
        streamNames: [],
        keys: []
      });
    }
  }, [form]);

  // 生成推流地址
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const config = {
        encryption: values.encryption,
        domain: values.domain,
        appName: values.appName,
        streamName: values.streamName,
        key: values.key || '',
        expireTime: values.expireTime ? values.expireTime.utc().format('YYYY-MM-DD HH:mm:ss') : ''
      };

      // 验证配置
      const validation = validateStreamConfig(config);
      if (!validation.valid) {
        validation.errors.forEach(error => message.error(error));
        return;
      }

      // 生成所有协议的URL
      const urls = generateAllProtocolUrls(config);
      setGeneratedUrls(urls);

      // 保存配置（为了兼容历史记录，我们保存RTMP协议的配置）
      const configForSave: StreamConfig = { ...config, protocol: 'RTMP' };
      saveLastConfig(configForSave);

      // 保存聚合历史记录
      saveAggregatedHistoryRecord(config, urls);

      // 更新历史输入值
      try {
        const updatedHistoryValues = getHistoryInputValues();
        setHistoryInputs(updatedHistoryValues);
      } catch (error) {
        console.warn('更新历史输入值失败:', error);
      }

      message.success('所有协议推流地址生成成功！');
    } catch (error) {
      console.error('生成推流地址失败:', error);
      message.error('生成推流地址失败，请检查输入参数');
    } finally {
      setLoading(false);
    }
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
    // 确保 textarea 可见但在视口外
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
        // 方案3：提示用户手动复制
        message.info('请手动复制：Ctrl+C / Cmd+C');
      }
    } catch (err) {
      textArea.remove();
      console.error('复制失败:', err);
      message.info('请手动复制：Ctrl+C / Cmd+C');
    }
  };

  // 清空表单
  const handleClear = () => {
    form.resetFields();
    setGeneratedUrls(null);
    form.setFieldsValue({
      encryption: 'MD5',
      appName: 'live'
    });
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
      'RTMP_OVER_SRT': 'RTMP over SRT',
      'RTMP_OVER_QUIC': 'RTMP over QUIC'
    };
    return names[protocol];
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>推流地址生成器</Title>
          <Button 
            icon={<HistoryOutlined />} 
            onClick={onHistoryClick}
          >
            历史记录
          </Button>
        </div>
      }>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="加密类型"
                name="encryption"
                rules={[{ required: true, message: '请选择加密类型' }]}
              >
                <Select placeholder="请选择加密类型">
                  {encryptionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="推流域名"
                name="domain"
                rules={[{ required: true, message: '请输入推流域名' }]}
              >
                <AutoComplete
                  placeholder="如: push.example.com"
                  options={historyInputs?.domains?.length > 0 
                    ? historyInputs.domains.map(domain => ({ value: domain, label: domain }))
                    : []
                  }
                  filterOption={(inputValue, option) => {
                    if (!inputValue || !option?.value) return true;
                    return option.value.toLowerCase().includes(inputValue.toLowerCase());
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item
                label="AppName"
                name="appName"
                rules={[{ required: true, message: '请输入AppName' }]}
              >
                <AutoComplete
                  placeholder="如: live"
                  options={historyInputs?.appNames?.length > 0 
                    ? historyInputs.appNames.map(appName => ({ value: appName, label: appName }))
                    : []
                  }
                  filterOption={(inputValue, option) => {
                    if (!inputValue || !option?.value) return true;
                    return option.value.toLowerCase().includes(inputValue.toLowerCase());
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item
                label="StreamName"
                name="streamName"
                rules={[{ required: true, message: '请输入StreamName' }]}
              >
                <AutoComplete
                  placeholder="如: stream001"
                  options={historyInputs?.streamNames?.length > 0 
                    ? historyInputs.streamNames.map(streamName => ({ value: streamName, label: streamName }))
                    : []
                  }
                  filterOption={(inputValue, option) => {
                    if (!inputValue || !option?.value) return true;
                    return option.value.toLowerCase().includes(inputValue.toLowerCase());
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="密钥 (可选)"
                name="key"
                tooltip="鉴权密钥，如果不需要鉴权可以为空"
              >
                <AutoComplete
                  placeholder="请输入密钥"
                  options={historyInputs?.keys?.length > 0 
                    ? historyInputs.keys.map(key => ({ value: key, label: key }))
                    : []
                  }
                  filterOption={(inputValue, option) => {
                    if (!inputValue || !option?.value) return true;
                    return option.value.toLowerCase().includes(inputValue.toLowerCase());
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                label="过期时间 (UTC)"
                name="expireTime"
                tooltip="推流地址的过期时间，使用UTC时间"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择过期时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成所有协议地址
              </Button>
              <Button onClick={handleClear} icon={<ClearOutlined />}>
                清空
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {generatedUrls && (
          <>
            <Divider />
            <div>
              <Title level={4}>生成的推流地址</Title>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {Object.entries(generatedUrls).map(([protocol, url]) => (
                  <Alert
                    key={protocol}
                    message={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          backgroundColor: getProtocolColor(protocol as ProtocolType), 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}>
                          {getProtocolDisplayName(protocol as ProtocolType)}
                        </span>
                        <span>推流地址已生成</span>
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
                          复制 {getProtocolDisplayName(protocol as ProtocolType)} 地址
                        </Button>
                      </div>
                    }
                    type="success"
                    showIcon
                  />
                ))}
                <div style={{ marginTop: '16px' }}>
                  <Button
                    type="primary" 
                    onClick={() => {
                      const allUrls = Object.entries(generatedUrls)
                        .map(([protocol, url]) => `${getProtocolDisplayName(protocol as ProtocolType)}: ${url}`)
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
          </>
        )}
      </Card>

      <Card title="使用说明" style={{ marginTop: '20px' }}>
        <div>
          <Title level={5}>功能特点</Title>
          <ul>
            <li><strong>一键生成：</strong> 同时生成所有协议的推流地址</li>
            <li><strong>多协议支持：</strong> RTMP、WebRTC、SRT、RTMP over SRT、RTMP over QUIC</li>
            <li><strong>灵活复制：</strong> 可以单独复制或批量复制所有地址</li>
            <li><strong>自动保存：</strong> 每种协议的地址都会保存到历史记录</li>
          </ul>

          <Title level={5}>协议说明</Title>
          <Space wrap>
            <Tag color="blue">RTMP - 实时消息传输协议</Tag>
            <Tag color="green">WebRTC - Web实时通信协议</Tag>
            <Tag color="orange">SRT - 安全可靠传输协议</Tag>
            <Tag color="purple">RTMP over SRT - 基于SRT的RTMP传输</Tag>
            <Tag color="red">RTMP over QUIC - 基于QUIC的RTMP传输</Tag>
          </Space>
          
          <Title level={5}>使用步骤</Title>
          <ol>
            <li>选择加密类型（MD5 或 SHA256）</li>
            <li>填写推流域名、AppName、StreamName</li>
            <li>可选择设置密钥和过期时间进行鉴权</li>
            <li>点击"生成所有协议地址"按钮</li>
            <li>根据需要复制对应协议的地址</li>
          </ol>
          
          <Title level={5}>注意事项</Title>
          <ul>
            <li>过期时间为UTC时间，格式：YYYY-MM-DD HH:MM:SS</li>
            <li>密钥和过期时间必须同时设置或同时为空</li>
            <li>所有协议地址会同时生成并保存到历史记录</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default StreamUrlGenerator;