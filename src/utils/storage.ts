import { StreamConfig, HistoryRecord, AggregatedHistoryRecord, AllProtocolUrls, PlayConfig, AggregatedPlayHistoryRecord, AllPlayProtocolUrls } from '../types';
import {
  saveStreamConfigAPI,
  getStreamConfigAPI,
  saveStreamHistoryAPI,
  getStreamHistoryAPI,
  deleteStreamHistoryAPI,
  clearStreamHistoryAPI,
  savePlayConfigAPI,
  getPlayConfigAPI,
  savePlayHistoryAPI,
  getPlayHistoryAPI,
  deletePlayHistoryAPI,
  clearPlayHistoryAPI,
} from './api';

// 内存缓存，用于同步操作的兼容
let streamConfigCache: StreamConfig | null = null;
let streamHistoryCache: AggregatedHistoryRecord[] = [];
let playConfigCache: PlayConfig | null = null;
let playHistoryCache: AggregatedPlayHistoryRecord[] = [];

// 初始化标志
let isInitialized = false;

/**
 * 初始化：从服务器加载数据到缓存
 */
export async function initializeStorage(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const [streamConfig, streamHistory, playConfig, playHistory] = await Promise.all([
      getStreamConfigAPI<StreamConfig>(),
      getStreamHistoryAPI<AggregatedHistoryRecord>(),
      getPlayConfigAPI<PlayConfig>(),
      getPlayHistoryAPI<AggregatedPlayHistoryRecord>(),
    ]);
    
    streamConfigCache = streamConfig;
    streamHistoryCache = streamHistory;
    playConfigCache = playConfig;
    playHistoryCache = playHistory;
    isInitialized = true;
  } catch (error) {
    console.error('初始化存储失败，使用本地缓存:', error);
  }
}

/**
 * 保存最后一次的配置
 */
export function saveLastConfig(config: StreamConfig): void {
  streamConfigCache = config;
  saveStreamConfigAPI(config).catch(err => console.error('保存配置到服务器失败:', err));
}

/**
 * 获取最后一次的配置
 */
export function getLastConfig(): StreamConfig | null {
  return streamConfigCache;
}

/**
 * 异步获取最后一次的配置
 */
export async function getLastConfigAsync(): Promise<StreamConfig | null> {
  try {
    const config = await getStreamConfigAPI<StreamConfig>();
    streamConfigCache = config;
    return config;
  } catch (error) {
    console.error('获取配置失败:', error);
    return streamConfigCache;
  }
}

/**
 * 保存历史记录（旧版兼容）
 */
export function saveHistoryRecord(record: HistoryRecord): void {
  // 旧版接口，不再使用
  console.warn('saveHistoryRecord is deprecated, use saveAggregatedHistoryRecord instead');
}

/**
 * 获取历史记录（旧版兼容）
 */
export function getHistory(): HistoryRecord[] {
  // 旧版接口，返回空数组
  return [];
}

/**
 * 清空历史记录（旧版兼容）
 */
export function clearHistory(): void {
  // 旧版接口
}

/**
 * 删除指定历史记录（旧版兼容）
 */
export function deleteHistoryRecord(id: string): void {
  // 旧版接口
}

/**
 * 保存聚合历史记录
 */
export function saveAggregatedHistoryRecord(config: Omit<StreamConfig, 'protocol'>, urls: AllProtocolUrls): void {
  const record: AggregatedHistoryRecord = {
    id: Date.now().toString(),
    config,
    generatedUrls: urls,
    createdAt: new Date().toISOString()
  };
  
  // 更新缓存
  streamHistoryCache.unshift(record);
  if (streamHistoryCache.length > 100) {
    streamHistoryCache.splice(100);
  }
  
  // 异步保存到服务器
  saveStreamHistoryAPI(record).catch(err => console.error('保存历史到服务器失败:', err));
}

/**
 * 获取聚合历史记录
 */
export function getAggregatedHistory(): AggregatedHistoryRecord[] {
  return streamHistoryCache;
}

/**
 * 异步获取聚合历史记录
 */
export async function getAggregatedHistoryAsync(): Promise<AggregatedHistoryRecord[]> {
  try {
    const history = await getStreamHistoryAPI<AggregatedHistoryRecord>();
    streamHistoryCache = history;
    return history;
  } catch (error) {
    console.error('获取历史失败:', error);
    return streamHistoryCache;
  }
}

/**
 * 清空聚合历史记录
 */
export function clearAggregatedHistory(): void {
  streamHistoryCache = [];
  clearStreamHistoryAPI().catch(err => console.error('清空历史失败:', err));
}

/**
 * 删除指定聚合历史记录
 */
export function deleteAggregatedHistoryRecord(id: string): void {
  streamHistoryCache = streamHistoryCache.filter(record => record.id !== id);
  deleteStreamHistoryAPI(id).catch(err => console.error('删除历史失败:', err));
}

/**
 * 获取历史输入值
 */
export function getHistoryInputValues(): {
  domains: string[];
  appNames: string[];
  streamNames: string[];
  keys: string[];
} {
  try {
    const history = streamHistoryCache;
    
    if (!Array.isArray(history)) {
      return {
        domains: [],
        appNames: [],
        streamNames: [],
        keys: []
      };
    }
    
    const domains: string[] = [];
    const appNames: string[] = [];
    const streamNames: string[] = [];
    const keys: string[] = [];
    
    history.forEach(record => {
      if (record && record.config) {
        if (record.config.domain && typeof record.config.domain === 'string') {
          domains.push(record.config.domain);
        }
        if (record.config.appName && typeof record.config.appName === 'string') {
          appNames.push(record.config.appName);
        }
        if (record.config.streamName && typeof record.config.streamName === 'string') {
          streamNames.push(record.config.streamName);
        }
        if (record.config.key && typeof record.config.key === 'string') {
          keys.push(record.config.key);
        }
      }
    });
    
    return {
      domains: Array.from(new Set(domains)).slice(0, 20),
      appNames: Array.from(new Set(appNames)).slice(0, 20),
      streamNames: Array.from(new Set(streamNames)).slice(0, 20),
      keys: Array.from(new Set(keys)).slice(0, 20)
    };
  } catch (error) {
    console.error('获取历史输入值失败:', error);
    return {
      domains: [],
      appNames: [],
      streamNames: [],
      keys: []
    };
  }
}

// ==================== 播放地址相关存储函数 ====================

/**
 * 保存最后一次的播放配置
 */
export function saveLastPlayConfig(config: PlayConfig): void {
  playConfigCache = config;
  savePlayConfigAPI(config).catch(err => console.error('保存播放配置到服务器失败:', err));
}

/**
 * 获取最后一次的播放配置
 */
export function getLastPlayConfig(): PlayConfig | null {
  return playConfigCache;
}

/**
 * 异步获取最后一次的播放配置
 */
export async function getLastPlayConfigAsync(): Promise<PlayConfig | null> {
  try {
    const config = await getPlayConfigAPI<PlayConfig>();
    playConfigCache = config;
    return config;
  } catch (error) {
    console.error('获取播放配置失败:', error);
    return playConfigCache;
  }
}

/**
 * 保存播放聚合历史记录
 */
export function saveAggregatedPlayHistoryRecord(config: PlayConfig, urls: AllPlayProtocolUrls): void {
  const record: AggregatedPlayHistoryRecord = {
    id: Date.now().toString(),
    config,
    generatedUrls: urls,
    createdAt: new Date().toISOString()
  };
  
  // 更新缓存
  playHistoryCache.unshift(record);
  if (playHistoryCache.length > 100) {
    playHistoryCache.splice(100);
  }
  
  // 异步保存到服务器
  savePlayHistoryAPI(record).catch(err => console.error('保存播放历史到服务器失败:', err));
}

/**
 * 获取播放聚合历史记录
 */
export function getAggregatedPlayHistory(): AggregatedPlayHistoryRecord[] {
  return playHistoryCache;
}

/**
 * 异步获取播放聚合历史记录
 */
export async function getAggregatedPlayHistoryAsync(): Promise<AggregatedPlayHistoryRecord[]> {
  try {
    const history = await getPlayHistoryAPI<AggregatedPlayHistoryRecord>();
    playHistoryCache = history;
    return history;
  } catch (error) {
    console.error('获取播放历史失败:', error);
    return playHistoryCache;
  }
}

/**
 * 清空播放聚合历史记录
 */
export function clearAggregatedPlayHistory(): void {
  playHistoryCache = [];
  clearPlayHistoryAPI().catch(err => console.error('清空播放历史失败:', err));
}

/**
 * 删除指定播放聚合历史记录
 */
export function deleteAggregatedPlayHistoryRecord(id: string): void {
  playHistoryCache = playHistoryCache.filter(record => record.id !== id);
  deletePlayHistoryAPI(id).catch(err => console.error('删除播放历史失败:', err));
}

/**
 * 获取播放历史输入值
 */
export function getPlayHistoryInputValues(): {
  domains: string[];
  appNames: string[];
  streamNames: string[];
  keys: string[];
} {
  try {
    const history = playHistoryCache;
    
    if (!Array.isArray(history)) {
      return {
        domains: [],
        appNames: [],
        streamNames: [],
        keys: []
      };
    }
    
    const domains: string[] = [];
    const appNames: string[] = [];
    const streamNames: string[] = [];
    const keys: string[] = [];
    
    history.forEach(record => {
      if (record && record.config) {
        if (record.config.domain && typeof record.config.domain === 'string') {
          domains.push(record.config.domain);
        }
        if (record.config.appName && typeof record.config.appName === 'string') {
          appNames.push(record.config.appName);
        }
        if (record.config.streamName && typeof record.config.streamName === 'string') {
          streamNames.push(record.config.streamName);
        }
        if (record.config.key && typeof record.config.key === 'string') {
          keys.push(record.config.key);
        }
      }
    });
    
    return {
      domains: Array.from(new Set(domains)).slice(0, 20),
      appNames: Array.from(new Set(appNames)).slice(0, 20),
      streamNames: Array.from(new Set(streamNames)).slice(0, 20),
      keys: Array.from(new Set(keys)).slice(0, 20)
    };
  } catch (error) {
    console.error('获取播放历史输入值失败:', error);
    return {
      domains: [],
      appNames: [],
      streamNames: [],
      keys: []
    };
  }
}
