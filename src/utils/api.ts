// API 基础配置 - 使用相对路径，前后端同源部署
const API_BASE_URL = '';

// 通用请求函数
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// ==================== 推流配置 API ====================

export async function saveStreamConfigAPI(config: unknown): Promise<void> {
  await request('/api/stream/config', {
    method: 'POST',
    body: JSON.stringify({ config }),
  });
}

export async function getStreamConfigAPI<T>(): Promise<T | null> {
  const result = await request<{ config: T | null }>('/api/stream/config');
  return result.config;
}

// ==================== 推流历史 API ====================

export async function saveStreamHistoryAPI(record: {
  id: string;
  config: unknown;
  generatedUrls: unknown;
  createdAt: string;
}): Promise<void> {
  await request('/api/stream/history', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function getStreamHistoryAPI<T>(): Promise<T[]> {
  const result = await request<{ history: T[] }>('/api/stream/history');
  return result.history;
}

export async function deleteStreamHistoryAPI(id: string): Promise<void> {
  await request(`/api/stream/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function clearStreamHistoryAPI(): Promise<void> {
  await request('/api/stream/history', {
    method: 'DELETE',
  });
}

// ==================== 播放配置 API ====================

export async function savePlayConfigAPI(config: unknown): Promise<void> {
  await request('/api/play/config', {
    method: 'POST',
    body: JSON.stringify({ config }),
  });
}

export async function getPlayConfigAPI<T>(): Promise<T | null> {
  const result = await request<{ config: T | null }>('/api/play/config');
  return result.config;
}

// ==================== 播放历史 API ====================

export async function savePlayHistoryAPI(record: {
  id: string;
  config: unknown;
  generatedUrls: unknown;
  createdAt: string;
}): Promise<void> {
  await request('/api/play/history', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function getPlayHistoryAPI<T>(): Promise<T[]> {
  const result = await request<{ history: T[] }>('/api/play/history');
  return result.history;
}

export async function deletePlayHistoryAPI(id: string): Promise<void> {
  await request(`/api/play/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function clearPlayHistoryAPI(): Promise<void> {
  await request('/api/play/history', {
    method: 'DELETE',
  });
}
