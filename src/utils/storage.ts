import { StreamConfig, HistoryRecord, AggregatedHistoryRecord, AllProtocolUrls } from '../types';

const STORAGE_KEYS = {
  LAST_CONFIG: 'stream_last_config',
  HISTORY: 'stream_history',
  AGGREGATED_HISTORY: 'stream_aggregated_history'
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