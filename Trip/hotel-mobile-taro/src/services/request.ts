import Taro from '@tarojs/taro';

const getBaseUrl = () => {
  if (process.env.TARO_ENV === 'h5') {
    return process.env.TARO_APP_API_BASE || '';
  }
  return process.env.TARO_APP_API_BASE || '';
};

export function request<T = any>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
}): Promise<T> {
  const base = getBaseUrl();
  const url = base ? `${base.replace(/\/$/, '')}${options.url}` : options.url;
  return Taro.request({
    url,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...options.header,
    },
    timeout: 10000,
  }).then((res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    }
    const err: any = new Error(res.data?.message || `HTTP ${res.statusCode}`);
    err.statusCode = res.statusCode;
    err.data = res.data;
    return Promise.reject(err);
  }).catch((err) => {
    const msg =
      err.errMsg?.includes('fail') || err.code === 'ECONNABORTED'
        ? '无法连接服务，请先启动 hotel-management 后端：cd hotel-management/backend && npm run start:dev'
        : err.message || '请求失败';
    return Promise.reject(new Error(msg));
  });
}
