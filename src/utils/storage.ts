import { StreamConfig, HistoryRecord, AggregatedHistoryRecord, AllProtocolUrls, PlayConfig, AggregatedPlayHistoryRecord, AllPlayProtocolUrls } from '../types';

const STORAGE_KEYS = {
  LAST_CONFIG: 'stream_last_config',
  HISTORY: 'stream_history',
  AGGREGATED_HISTORY: 'stream_aggregated_history',
  LAST_PLAY_CONFIG: 'play_last_config',
  AGGREGATED_PLAY_HISTORY: 'play_aggregated_history'
};

/**
 * 保存最后一次的配置
 */
export function saveLastConfig(config: StreamConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

/**
 * 获取最后一次的配置
 */
export function getLastConfig(): StreamConfig | null {
  try {
    const configStr = localStorage.getItem(STORAGE_KEYS.LAST_CONFIG);
    return configStr ? JSON.parse(configStr) : null;
  } catch (error) {
    console.error('获取配置失败:', error);
    return null;
  }
}

/**
 * 保存历史记录
 */
export function saveHistoryRecord(record: HistoryRecord): void {
  try {
    const history = getHistory();
    // 将新记录添加到开头
    history.unshift(record);
    // 限制历史记录数量为100条
    if (history.length > 100) {
      history.splice(100);
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}

/**
 * 获取历史记录
 */
export function getHistory(): HistoryRecord[] {
  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return [];
  }
}

/**
 * 清空历史记录
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.error('清空历史记录失败:', error);
  }
}

/**
 * 删除指定历史记录
 */
export function deleteHistoryRecord(id: string): void {
  try {
    const history = getHistory();
    const filteredHistory = history.filter(record => record.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('删除历史记录失败:', error);
  }
}

/**
 * 保存聚合历史记录
 */
export function saveAggregatedHistoryRecord(config: Omit<StreamConfig, 'protocol'>, urls: AllProtocolUrls): void {
  try {
    const record: AggregatedHistoryRecord = {
      id: Date.now().toString(),
      config,
      generatedUrls: urls,
      createdAt: new Date().toISOString()
    };
    
    const history = getAggregatedHistory();
    // 将新记录添加到开头
    history.unshift(record);
    // 限制历史记录数量为100条
    if (history.length > 100) {
      history.splice(100);
    }
    localStorage.setItem(STORAGE_KEYS.AGGREGATED_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('保存聚合历史记录失败:', error);
  }
}

/**
 * 获取聚合历史记录
 */
export function getAggregatedHistory(): AggregatedHistoryRecord[] {
  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.AGGREGATED_HISTORY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error('获取聚合历史记录失败:', error);
    return [];
  }
}

/**
 * 清空聚合历史记录
 */
export function clearAggregatedHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AGGREGATED_HISTORY);
  } catch (error) {
    console.error('清空聚合历史记录失败:', error);
  }
}

/**
 * 删除指定聚合历史记录
 */
export function deleteAggregatedHistoryRecord(id: string): void {
  try {
    const history = getAggregatedHistory();
    const filteredHistory = history.filter(record => record.id !== id);
    localStorage.setItem(STORAGE_KEYS.AGGREGATED_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('删除聚合历史记录失败:', error);
  }
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
    const history = getAggregatedHistory();
    
    if (!Array.isArray(history)) {
      console.warn('History is not an array:', history);
      return {
        domains: [],
        appNames: [],
        streamNames: [],
        keys: []
      };
    }
    
    // 提取所有唯一的输入值，添加安全检查
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
    
    // 去重并限制数量
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
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_PLAY_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('保存播放配置失败:', error);
  }
}

/**
 * 获取最后一次的播放配置
 */
export function getLastPlayConfig(): PlayConfig | null {
  try {
    const configStr = localStorage.getItem(STORAGE_KEYS.LAST_PLAY_CONFIG);
    return configStr ? JSON.parse(configStr) : null;
  } catch (error) {
    console.error('获取播放配置失败:', error);
    return null;
  }
}

/**
 * 保存播放聚合历史记录
 */
export function saveAggregatedPlayHistoryRecord(config: PlayConfig, urls: AllPlayProtocolUrls): void {
  try {
    const record: AggregatedPlayHistoryRecord = {
      id: Date.now().toString(),
      config,
      generatedUrls: urls,
      createdAt: new Date().toISOString()
    };
    
    const history = getAggregatedPlayHistory();
    // 将新记录添加到开头
    history.unshift(record);
    // 限制历史记录数量为100条
    if (history.length > 100) {
      history.splice(100);
    }
    localStorage.setItem(STORAGE_KEYS.AGGREGATED_PLAY_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('保存播放聚合历史记录失败:', error);
  }
}

/**
 * 获取播放聚合历史记录
 */
export function getAggregatedPlayHistory(): AggregatedPlayHistoryRecord[] {
  try {
    const historyStr = localStorage.getItem(STORAGE_KEYS.AGGREGATED_PLAY_HISTORY);
    return historyStr ? JSON.parse(historyStr) : [];
  } catch (error) {
    console.error('获取播放聚合历史记录失败:', error);
    return [];
  }
}

/**
 * 清空播放聚合历史记录
 */
export function clearAggregatedPlayHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AGGREGATED_PLAY_HISTORY);
  } catch (error) {
    console.error('清空播放聚合历史记录失败:', error);
  }
}

/**
 * 删除指定播放聚合历史记录
 */
export function deleteAggregatedPlayHistoryRecord(id: string): void {
  try {
    const history = getAggregatedPlayHistory();
    const filteredHistory = history.filter(record => record.id !== id);
    localStorage.setItem(STORAGE_KEYS.AGGREGATED_PLAY_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('删除播放聚合历史记录失败:', error);
  }
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
    const history = getAggregatedPlayHistory();
    
    if (!Array.isArray(history)) {
      console.warn('Play history is not an array:', history);
      return {
        domains: [],
        appNames: [],
        streamNames: [],
        keys: []
      };
    }
    
    // 提取所有唯一的输入值，添加安全检查
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
    
    // 去重并限制数量
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