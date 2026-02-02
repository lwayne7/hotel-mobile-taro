import Taro from '@tarojs/taro';

// ============ 配置常量 ============
const API_BASE_STORAGE_KEY = 'TARO_APP_API_BASE';
const TOKEN_STORAGE_KEY = 'TARO_APP_TOKEN';
const DEFAULT_DEV_API_BASE = 'http://127.0.0.1:3000';
const REQUEST_TIMEOUT = 10000;

// ============ 类型定义 ============
export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  /** 是否跳过 Token 注入 */
  skipAuth?: boolean;
  /** 自定义超时时间 */
  timeout?: number;
}

export interface RequestInterceptor {
  onRequest?: (options: RequestOptions) => RequestOptions | Promise<RequestOptions>;
  onResponse?: <T>(response: T, options: RequestOptions) => T | Promise<T>;
  onError?: (error: Error, options: RequestOptions) => Error | Promise<never>;
}

// ============ 拦截器注册 ============
const interceptors: RequestInterceptor[] = [];

export function addInterceptor(interceptor: RequestInterceptor): () => void {
  interceptors.push(interceptor);
  return () => {
    const index = interceptors.indexOf(interceptor);
    if (index > -1) interceptors.splice(index, 1);
  };
}

// ============ 内置拦截器：Token 注入 ============
addInterceptor({
  onRequest: (options) => {
    if (options.skipAuth) return options;
    try {
      const token = Taro.getStorageSync(TOKEN_STORAGE_KEY);
      if (token) {
        options.header = {
          ...options.header,
          Authorization: `Bearer ${token}`,
        };
      }
    } catch {
      // 忽略存储读取失败
    }
    return options;
  },
});

// ============ 内置拦截器：401 处理 ============
addInterceptor({
  onError: async (error: any, _options) => {
    if (error.statusCode === 401) {
      // 清除 Token
      try {
        Taro.removeStorageSync(TOKEN_STORAGE_KEY);
      } catch {
        // 忽略
      }
      // 跳转登录页（如果有）
      // Taro.navigateTo({ url: '/pages/login/index' });
    }
    throw error;
  },
});

// ============ 工具函数 ============
const getRuntimeBaseUrl = (): string => {
  try {
    const stored = Taro.getStorageSync(API_BASE_STORAGE_KEY);
    return typeof stored === 'string' ? stored : '';
  } catch {
    return '';
  }
};

const getBaseUrl = (): string => {
  const stored = getRuntimeBaseUrl();
  if (stored) return stored;
  const envBase = process.env.TARO_APP_API_BASE || '';
  if (envBase) return envBase;

  // H5 开发可使用 devServer proxy（保持空字符串）
  if (process.env.TARO_ENV === 'h5') return '';

  // 小程序 / RN：没有配置时给一个本地默认值
  return DEFAULT_DEV_API_BASE;
};

const getAlternateLocalUrl = (url: string): string => {
  if (url.startsWith('http://localhost')) return url.replace('http://localhost', 'http://127.0.0.1');
  if (url.startsWith('https://localhost')) return url.replace('https://localhost', 'https://127.0.0.1');
  if (url.startsWith('http://127.0.0.1')) return url.replace('http://127.0.0.1', 'http://localhost');
  if (url.startsWith('https://127.0.0.1')) return url.replace('https://127.0.0.1', 'https://localhost');
  return '';
};

const isWeappDevtools = (): boolean => {
  if (process.env.TARO_ENV !== 'weapp') return false;
  try {
    return Taro.getSystemInfoSync().platform === 'devtools';
  } catch {
    return false;
  }
};

const isMiniProgramDomainError = (err: any): boolean => {
  const msg = String(err?.errMsg || err?.message || '');
  return (
    msg.includes('合法域名') ||
    msg.includes('request 合法域名') ||
    msg.includes('not in the request legal domain list') ||
    msg.includes('url not in domain list')
  );
};

const isNetworkError = (err: any): boolean => {
  const msg = String(err?.errMsg || err?.message || '');
  return msg.includes('request:fail') || msg.includes('Network Error') || err?.code === 'ECONNABORTED';
};

const isHttpError = (err: any): boolean => typeof err?.statusCode === 'number';

const formatErrorMessage = (err: any, primaryUrl: string): string => {
  if (isMiniProgramDomainError(err)) {
    return '小程序请求域名未配置：开发者工具「详情-本地设置」勾选"不校验合法域名…"或在公众平台「开发设置-服务器域名」配置 HTTPS 域名后，在「详情-域名信息」刷新并重新编译';
  }
  if (isHttpError(err)) {
    return err.statusCode >= 500
      ? `后端接口异常（HTTP ${err.statusCode}），请查看后端控制台日志（请求：${primaryUrl}）`
      : `请求失败（HTTP ${err.statusCode}）：${err.message || '请检查请求参数/权限'}（请求：${primaryUrl}）`;
  }
  if (isNetworkError(err)) {
    if (process.env.TARO_ENV === 'weapp' && !isWeappDevtools() && /(localhost|127\.0\.0\.1)/.test(primaryUrl)) {
      return '无法连接服务：真机调试不能用 localhost/127.0.0.1，请把 TARO_APP_API_BASE 改成电脑局域网 IP（如 http://192.168.x.x:3000）后重新编译';
    }
    return `无法连接服务，请先启动 hotel-management 后端：cd hotel-management/backend && npm run start:dev（请求：${primaryUrl}）`;
  }
  return err.message || '请求失败';
};

// ============ 核心请求函数 ============
export async function request<T = any>(options: RequestOptions): Promise<T> {
  // 执行请求拦截器
  let processedOptions = { ...options };
  for (const interceptor of interceptors) {
    if (interceptor.onRequest) {
      processedOptions = await interceptor.onRequest(processedOptions);
    }
  }

  const base = getBaseUrl();
  const primaryUrl = base ? `${base.replace(/\/$/, '')}${processedOptions.url}` : processedOptions.url;

  const doRequest = async (url: string): Promise<T> => {
    const res = await Taro.request({
      url,
      method: processedOptions.method || 'GET',
      data: processedOptions.data,
      header: {
        'Content-Type': 'application/json',
        ...processedOptions.header,
      },
      timeout: processedOptions.timeout || REQUEST_TIMEOUT,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      // 执行响应拦截器
      let result = res.data as T;
      for (const interceptor of interceptors) {
        if (interceptor.onResponse) {
          result = await interceptor.onResponse(result, processedOptions);
        }
      }
      return result;
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
    // 小程序本地开发时尝试 localhost/127.0.0.1 切换
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

    // 执行错误拦截器
    let processedError = new Error(formatErrorMessage(err, primaryUrl)) as any;
    processedError.statusCode = err.statusCode;
    processedError.originalError = err;

    for (const interceptor of interceptors) {
      if (interceptor.onError) {
        try {
          await interceptor.onError(processedError, processedOptions);
        } catch (e) {
          processedError = e;
        }
      }
    }

    throw processedError;
  }
}

// ============ 便捷方法 ============
export const http = {
  get: <T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>) =>
    request<T>({ ...options, url, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) =>
    request<T>({ ...options, url, method: 'POST', data }),

  put: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) =>
    request<T>({ ...options, url, method: 'PUT', data }),

  delete: <T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>) =>
    request<T>({ ...options, url, method: 'DELETE' }),
};
