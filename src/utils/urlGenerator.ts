import CryptoJS from 'crypto-js';
import { StreamConfig, ProtocolType, EncryptionType, AllProtocolUrls } from '../types';

/**
 * 将UTC时间字符串转换为Unix时间戳的十六进制表示
 * @param utcTimeStr UTC时间字符串，格式：YYYY-MM-DD HH:MM:SS
 * @returns 十六进制时间戳
 */
export function convertTimeToHex(utcTimeStr: string): string {
  const date = new Date(utcTimeStr + ' UTC');
  const timestamp = Math.floor(date.getTime() / 1000);
  return timestamp.toString(16).toUpperCase();
}

/**
 * 生成鉴权密钥
 * @param key 密钥
 * @param streamName 流名称
 * @param hexTime 十六进制时间戳
 * @param encryption 加密类型
 * @returns 鉴权密钥
 */
export function generateTxSecret(
  key: string,
  streamName: string,
  hexTime: string,
  encryption: EncryptionType
): string {
  const plainText = key + streamName + hexTime;
  
  if (encryption === 'MD5') {
    return CryptoJS.MD5(plainText).toString();
  } else {
    return CryptoJS.SHA256(plainText).toString();
  }
}

/**
 * 生成推流地址
 * @param config 推流配置
 * @returns 生成的推流地址
 */
export function generateStreamUrl(config: StreamConfig): string {
  const { protocol, domain, appName, streamName, key, expireTime, encryption } = config;
  
  // 如果没有key或过期时间，生成基础地址
  if (!key || !expireTime) {
    return generateBaseUrl(protocol, domain, appName, streamName);
  }
  
  const hexTime = convertTimeToHex(expireTime);
  const txSecret = generateTxSecret(key, streamName, hexTime, encryption);
  
  switch (protocol) {
    case 'RTMP':
      return `rtmp://${domain}/${appName}/${streamName}?txSecret=${txSecret}&txTime=${hexTime}`;
    
    case 'WebRTC':
      return `webrtc://${domain}/${appName}/${streamName}?txSecret=${txSecret}&txTime=${hexTime}`;
    
    case 'SRT':
      return `srt://${domain}:9000?streamid=#!::h=${domain},r=${appName}/${streamName},txSecret=${txSecret},txTime=${hexTime}`;
    
    case 'RTMP_OVER_SRT':
      return `rtmp://${domain}:3570/${appName}/${streamName}?txSecret=${txSecret}&txTime=${hexTime}`;
    
    case 'RTMP_OVER_QUIC':
      return `rtmp://${domain}:443/${appName}/${streamName}?txSecret=${txSecret}&txTime=${hexTime}`;
    
    default:
      throw new Error(`不支持的协议类型: ${protocol}`);
  }
}

/**
 * 生成基础地址（无鉴权）
 */
function generateBaseUrl(protocol: ProtocolType, domain: string, appName: string, streamName: string): string {
  switch (protocol) {
    case 'RTMP':
      return `rtmp://${domain}/${appName}/${streamName}`;
    
    case 'WebRTC':
      return `webrtc://${domain}/${appName}/${streamName}`;
    
    case 'SRT':
      return `srt://${domain}:9000?streamid=#!::h=${domain},r=${appName}/${streamName}`;
    
    case 'RTMP_OVER_SRT':
      return `rtmp://${domain}:3570/${appName}/${streamName}`;
    
    case 'RTMP_OVER_QUIC':
      return `rtmp://${domain}:443/${appName}/${streamName}`;
    
    default:
      throw new Error(`不支持的协议类型: ${protocol}`);
  }
}

/**
 * 生成所有协议的推流地址
 * @param config 推流配置（不包含protocol字段）
 * @returns 所有协议的推流地址
 */
export function generateAllProtocolUrls(config: Omit<StreamConfig, 'protocol'>): AllProtocolUrls {
  const protocols: ProtocolType[] = ['RTMP', 'WebRTC', 'SRT', 'RTMP_OVER_SRT', 'RTMP_OVER_QUIC'];
  
  const urls: AllProtocolUrls = {
    RTMP: '',
    WebRTC: '',
    SRT: '',
    RTMP_OVER_SRT: '',
    RTMP_OVER_QUIC: ''
  };
  
  protocols.forEach(protocol => {
    const fullConfig: StreamConfig = { ...config, protocol };
    urls[protocol] = generateStreamUrl(fullConfig);
  });
  
  return urls;
}

/**
 * 验证推流配置
 * @param config 推流配置
 * @returns 验证结果
 */
export function validateStreamConfig(config: StreamConfig | Omit<StreamConfig, 'protocol'>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.domain.trim()) {
    errors.push('推流域名不能为空');
  }
  
  if (!config.appName.trim()) {
    errors.push('AppName不能为空');
  }
  
  if (!config.streamName.trim()) {
    errors.push('StreamName不能为空');
  }
  
  // 如果设置了key或过期时间，两者都必须设置
  if ((config.key && !config.expireTime) || (!config.key && config.expireTime)) {
    errors.push('密钥和过期时间必须同时设置或同时为空');
  }
  
  // 验证时间格式
  if (config.expireTime) {
    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(config.expireTime)) {
      errors.push('过期时间格式不正确，应为：YYYY-MM-DD HH:MM:SS');
    } else {
      const date = new Date(config.expireTime + ' UTC');
      if (isNaN(date.getTime())) {
        errors.push('过期时间无效');
      } else if (date.getTime() <= Date.now()) {
        errors.push('过期时间不能早于当前时间');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}