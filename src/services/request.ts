import Taro from '@tarojs/taro';

const API_BASE_STORAGE_KEY = 'TARO_APP_API_BASE';
const DEFAULT_DEV_API_BASE = 'http://127.0.0.1:3000';

const getRuntimeBaseUrl = () => {
  try {
    const stored = Taro.getStorageSync(API_BASE_STORAGE_KEY);
    return typeof stored === 'string' ? stored : '';
  } catch {
    return '';
  }
};

const getBaseUrl = () => {
  const stored = getRuntimeBaseUrl();
  if (stored) return stored;
  const envBase = process.env.TARO_APP_API_BASE || '';
  if (envBase) return envBase;

  // H5 开发可使用 devServer proxy（保持空字符串）
  if (process.env.TARO_ENV === 'h5') return '';

  // 小程序 / RN：没有配置时给一个本地默认值，避免 url 形如 "/api/xxx" 导致请求失败
  return DEFAULT_DEV_API_BASE;
};

const getAlternateLocalUrl = (url: string) => {
  if (url.startsWith('http://localhost')) return url.replace('http://localhost', 'http://127.0.0.1');
  if (url.startsWith('https://localhost')) return url.replace('https://localhost', 'https://127.0.0.1');
  if (url.startsWith('http://127.0.0.1')) return url.replace('http://127.0.0.1', 'http://localhost');
  if (url.startsWith('https://127.0.0.1')) return url.replace('https://127.0.0.1', 'https://localhost');
  return '';
};

const isWeappDevtools = () => {
  if (process.env.TARO_ENV !== 'weapp') return false;
  try {
    return Taro.getSystemInfoSync().platform === 'devtools';
  } catch {
    return false;
  }
};

const isMiniProgramDomainError = (err: any) => {
  const msg = String(err?.errMsg || err?.message || '');
  return (
    msg.includes('合法域名') ||
    msg.includes('request 合法域名') ||
    msg.includes('not in the request legal domain list') ||
    msg.includes('url not in domain list')
  );
};

const isNetworkError = (err: any) => {
  const msg = String(err?.errMsg || err?.message || '');
  return msg.includes('request:fail') || msg.includes('Network Error') || err?.code === 'ECONNABORTED';
};

const isHttpError = (err: any) => typeof err?.statusCode === 'number';

export async function request<T = any>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
}): Promise<T> {
  const base = getBaseUrl();
  const primaryUrl = base ? `${base.replace(/\/$/, '')}${options.url}` : options.url;

  const doRequest = async (url: string): Promise<T> => {
    const res = await Taro.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header,
      },
      timeout: 10000,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    }

    const message = Array.isArray((res.data as any)?.message)
      ? (res.data as any).message.join('; ')
      : (res.data as any)?.message;
    const err: any = new Error(message || `HTTP ${res.statusCode}`);
    err.statusCode = res.statusCode;
    err.data = res.data;
    throw err;
  };

  try {
    return await doRequest(primaryUrl);
  } catch (err: any) {
    if (
      process.env.TARO_ENV === 'weapp' &&
      isNetworkError(err) &&
      !isMiniProgramDomainError(err)
    ) {
      const altUrl = getAlternateLocalUrl(primaryUrl);
      if (altUrl && altUrl !== primaryUrl) {
        try {
          return await doRequest(altUrl);
        } catch (err2: any) {
          err = err2;
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[request] failed', { url: primaryUrl, err });
    }

    const msg = isMiniProgramDomainError(err)
      ? '小程序请求域名未配置：开发者工具「详情-本地设置」勾选“不校验合法域名…”或在公众平台「开发设置-服务器域名」配置 HTTPS 域名后，在「详情-域名信息」刷新并重新编译'
      : isHttpError(err)
        ? err.statusCode >= 500
          ? `后端接口异常（HTTP ${err.statusCode}），请查看后端控制台日志（请求：${primaryUrl}）`
          : `请求失败（HTTP ${err.statusCode}）：${err.message || '请检查请求参数/权限'}（请求：${primaryUrl}）`
      : isNetworkError(err)
        ? process.env.TARO_ENV === 'weapp' && !isWeappDevtools() && /(localhost|127\.0\.0\.1)/.test(primaryUrl)
          ? '无法连接服务：真机调试不能用 localhost/127.0.0.1，请把 TARO_APP_API_BASE 改成电脑局域网 IP（如 http://192.168.x.x:3000）后重新编译'
          : `无法连接服务，请先启动 hotel-management 后端：cd hotel-management/backend && npm run start:dev（请求：${primaryUrl}）`
        : err.message || '请求失败';

    throw new Error(msg);
  }
}
