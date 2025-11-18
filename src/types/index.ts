// 协议类型
export type ProtocolType = 'RTMP' | 'WebRTC' | 'SRT' | 'RTMP_OVER_SRT' | 'RTMP_OVER_QUIC';

// 加密类型
export type EncryptionType = 'MD5' | 'SHA256';

// 推流配置
export interface StreamConfig {
  protocol: ProtocolType;
  encryption: EncryptionType;
  domain: string;
  appName: string;
  streamName: string;
  key: string;
  expireTime: string; // UTC时间，格式为YYYY-MM-DD HH:MM:SS
}

// 历史记录
export interface HistoryRecord {
  id: string;
  config: StreamConfig;
  generatedUrl: string;
  createdAt: string;
}

// 聚合历史记录（包含所有协议）
export interface AggregatedHistoryRecord {
  id: string;
  config: Omit<StreamConfig, 'protocol'>; // 不包含protocol字段
  generatedUrls: AllProtocolUrls;
  createdAt: string;
}

// 生成的URL结果
export interface GeneratedUrls {
  protocol: ProtocolType;
  url: string;
}

// 所有协议的生成结果
export interface AllProtocolUrls {
  RTMP: string;
  WebRTC: string;
  SRT: string;
  RTMP_OVER_SRT: string;
  RTMP_OVER_QUIC: string;
}