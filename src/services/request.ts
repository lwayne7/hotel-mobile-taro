import Taro from '@tarojs/taro';

// ============ 配置常量 ============
const API_BASE_STORAGE_KEY = 'TARO_APP_API_BASE';
const TOKEN_STORAGE_KEY = 'TARO_APP_TOKEN';
// 默认开发后端地址（小程序/APP 端必须是完整 URL；H5 开发走 proxy 不需要）
// 统一使用 localhost，并在 weapp 端自动在 localhost 与 127.0.0.1 之间尝试切换，避免端间不一致
const DEFAULT_DEV_API_BASE = 'http://localhost:3000';
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

/** 用于 React Query 缓存 Key 的 API Base 标识 */
export function getApiBaseCacheKey(): string {
  try {
    return getBaseUrl() || 'relative';
  } catch {
    return 'unknown';
  }
}

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
  onError: async (error: unknown, _options) => {
    if ((error as { statusCode?: number }).statusCode === 401) {
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

const isPrivateIpv4 = (host: string): boolean => {
  // host may include port already stripped by URL parser; ensure pure ipv4
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.startsWith('10.')) return true;
  if (host.startsWith('192.168.')) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m) {
    const n = Number(m[1]);
    return n >= 16 && n <= 31;
  }
  return false;
};

const getUrlHostPort = (baseUrl: string): { host: string; port: string } | null => {
  const trimmed = baseUrl.trim();
  const match = trimmed.match(/^https?:\/\/([^/:?#]+)(?::(\d+))?/i);
  if (!match) return null;
  const host = match[1];
  const port = match[2] || (trimmed.startsWith('https://') ? '443' : '80');
  return { host, port };
};

const getBaseUrl = (): string => {
  // 以构建期注入的 env 为准，避免小程序端残留 Storage 配置导致“H5 正常、小程序命中错误后端/空库”
  const envBase = (process.env.TARO_APP_API_BASE || '').trim();
  if (envBase) {
    // 微信开发者工具里，访问“本机后端”用 localhost 最稳；
    // 某些网络/VPN 场景下局域网 IP 可能在 DevTools 内不可达，导致小程序端始终空列表/报错。
    if (process.env.TARO_ENV === 'weapp' && isWeappDevtools()) {
      const hostPort = getUrlHostPort(envBase);
      if (hostPort && isPrivateIpv4(hostPort.host)) {
        return `http://localhost:${hostPort.port}`;
      }
    }
    return envBase;
  }

  // 运行期 Storage 覆盖仅在开发环境启用，避免生产包因为旧缓存命中错误后端
  if (process.env.NODE_ENV !== 'production') {
    const stored = getRuntimeBaseUrl().trim();
    if (stored && /^https?:\/\//.test(stored)) return stored;
  }

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

let cachedIsWeappDevtools: boolean | null = null;

const isWeappDevtools = (): boolean => {
  if (process.env.TARO_ENV !== 'weapp') return false;
  if (cachedIsWeappDevtools !== null) return cachedIsWeappDevtools;
  try {
    type WxApi = { getAppBaseInfo?: () => { platform?: string }; getSystemInfoSync?: () => { platform?: string } };
    const wxApi = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>).wx as WxApi | undefined : undefined;
    let platform: string | undefined;
    if (wxApi?.getAppBaseInfo) {
      platform = wxApi.getAppBaseInfo().platform;
    } else if (wxApi?.getSystemInfoSync) {
      platform = wxApi.getSystemInfoSync().platform;
    } else {
      const systemInfo = Taro.getSystemInfoSync();
      platform = systemInfo?.platform;
    }
    cachedIsWeappDevtools = platform === 'devtools';
    return cachedIsWeappDevtools;
  } catch {
    cachedIsWeappDevtools = false;
    return cachedIsWeappDevtools;
  }
};

export function isWeappDevtoolsRuntime(): boolean {
  return isWeappDevtools();
}

const getErrorMsg = (err: unknown): string =>
  String((err as { errMsg?: string; message?: string })?.errMsg ?? (err as { message?: string })?.message ?? '');

const isMiniProgramDomainError = (err: unknown): boolean => {
  const msg = getErrorMsg(err);
  return (
    msg.includes('合法域名') ||
    msg.includes('request 合法域名') ||
    msg.includes('not in the request legal domain list') ||
    msg.includes('url not in domain list')
  );
};

const isNetworkError = (err: unknown): boolean => {
  const msg = getErrorMsg(err);
  const code = (err as { code?: string })?.code;
  return msg.includes('request:fail') || msg.includes('Network Error') || code === 'ECONNABORTED';
};

const isHttpError = (err: unknown): boolean =>
  typeof (err as { statusCode?: number })?.statusCode === 'number';

/** 从响应 body 中取出 message 文本（支持 string | string[]） */
function getResponseMessage(data: unknown): string {
  if (data == null || typeof data !== 'object') return '';
  const msg = (data as { message?: string | string[] }).message;
  return Array.isArray(msg) ? msg.join('; ') : typeof msg === 'string' ? msg : '';
}

const formatErrorMessage = (err: unknown, primaryUrl: string): string => {
  if (isMiniProgramDomainError(err)) {
    return '小程序请求域名未配置：开发者工具「详情-本地设置」勾选"不校验合法域名…"或在公众平台「开发设置-服务器域名」配置 HTTPS 域名后，在「详情-域名信息」刷新并重新编译';
  }
  if (isHttpError(err)) {
    const code = (err as { statusCode: number }).statusCode;
    const detail = (err as Error).message || '请检查请求参数/权限';
    return code >= 500
      ? `后端接口异常（HTTP ${code}），请查看后端控制台日志（请求：${primaryUrl}）`
      : `请求失败（HTTP ${code}）：${detail}（请求：${primaryUrl}）`;
  }
  if (isNetworkError(err)) {
    if (process.env.TARO_ENV === 'weapp' && !isWeappDevtools() && /(localhost|127\.0\.0\.1)/.test(primaryUrl)) {
      return '无法连接服务：真机调试不能用 localhost/127.0.0.1，请把 TARO_APP_API_BASE 改成电脑局域网 IP（如 http://192.168.x.x:3000）后重新编译';
    }
    return `无法连接服务，请先启动 hotel-management 后端：cd hotel-management/backend && npm run start:dev（请求：${primaryUrl}）`;
  }
  return (err as Error).message || '请求失败';
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

  const shouldDebugLog =
    process.env.TARO_ENV === 'weapp' &&
    /\/api\/public\/hotels/.test(processedOptions.url) &&
    (process.env.NODE_ENV !== 'production' || isWeappDevtools());

  /** 解析响应体：字符串则尝试 JSON，并识别 200 体内的错误结构 */
  const parseResponseBody = (data: unknown, url: string): unknown => {
    let body = data;
    if (typeof body === 'string') {
      const trimmed = body.trim();
      if (!trimmed) return body;
      const snippet = () => trimmed.slice(0, 120).replace(/\s+/g, ' ');
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        throw new Error(`接口返回非 JSON，请检查小程序请求地址/代理配置（请求：${url}，响应片段：${snippet()}）`);
      }
      try {
        body = JSON.parse(trimmed);
      } catch {
        throw new Error(`接口 JSON 解析失败，请检查后端返回格式（请求：${url}，响应片段：${snippet()}）`);
      }
    }
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      const statusCode = obj.statusCode;
      if (typeof statusCode === 'number' && statusCode >= 400) {
        const e = new Error(getResponseMessage(body) || `HTTP ${statusCode}`) as Error & { statusCode: number; data: unknown };
        e.statusCode = statusCode;
        e.data = body;
        throw e;
      }
      const errcode = obj.errcode;
      if (typeof errcode === 'number' && errcode !== 0) {
        const e = new Error((obj.errmsg as string) || `errcode ${errcode}`) as Error & { code: number; data: unknown };
        e.code = errcode;
        e.data = body;
        throw e;
      }
    }
    return body;
  };

  const doRequest = async (url: string): Promise<T> => {
    if (shouldDebugLog) {
      // eslint-disable-next-line no-console
      console.log('[request] ->', {
        url,
        base,
        envBase: process.env.TARO_APP_API_BASE || '',
        storageBase: getRuntimeBaseUrl(),
        nodeEnv: process.env.NODE_ENV,
        taroEnv: process.env.TARO_ENV,
        method: processedOptions.method || 'GET',
        data: processedOptions.data,
      });
    }

    const res = await Taro.request({
      url,
      method: processedOptions.method || 'GET',
      data: processedOptions.data,
      header: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...processedOptions.header,
      },
      dataType: 'json',
      timeout: processedOptions.timeout || REQUEST_TIMEOUT,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      let result = parseResponseBody(res.data, url) as T;

      if (shouldDebugLog) {
        const summary =
          result && typeof result === 'object' ? { keys: Object.keys(result as any).slice(0, 20) } : { type: typeof result };
        // eslint-disable-next-line no-console
        console.log('[request] <-', { url, statusCode: res.statusCode, summary });
      }

      for (const interceptor of interceptors) {
        if (interceptor.onResponse) {
          result = await interceptor.onResponse(result, processedOptions);
        }
      }
      return result;
    }

    const message = getResponseMessage(res.data) || `HTTP ${res.statusCode}`;
    const err = new Error(message) as Error & { statusCode: number; data: unknown };
    err.statusCode = res.statusCode;
    err.data = res.data;
    throw err;
  };

  try {
    return await doRequest(primaryUrl);
  } catch (err: unknown) {
    if (
      process.env.TARO_ENV === 'weapp' &&
      isNetworkError(err) &&
      !isMiniProgramDomainError(err)
    ) {
      const altUrl = getAlternateLocalUrl(primaryUrl);
      if (altUrl && altUrl !== primaryUrl) {
        try {
          return await doRequest(altUrl);
        } catch (err2) {
          err = err2;
        }
      }
    }

    if (process.env.NODE_ENV !== 'production' || isWeappDevtools()) {
      // eslint-disable-next-line no-console
      console.warn('[request] failed', { url: primaryUrl, err });
    }

    const statusCode = (err as { statusCode?: number })?.statusCode;
    let processedError: Error & { statusCode?: number; originalError?: unknown } = Object.assign(
      new Error(formatErrorMessage(err, primaryUrl)),
      { statusCode, originalError: err }
    );

    for (const interceptor of interceptors) {
      if (interceptor.onError) {
        try {
          await interceptor.onError(processedError, processedOptions);
        } catch (e) {
          processedError = e as Error & { statusCode?: number; originalError?: unknown };
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
