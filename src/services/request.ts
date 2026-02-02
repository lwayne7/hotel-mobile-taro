import Taro from '@tarojs/taro';

// ============ 配置常量 ============
const API_BASE_STORAGE_KEY = 'TARO_APP_API_BASE';
const TOKEN_STORAGE_KEY = 'TARO_APP_TOKEN';
// 默认开发后端地址（小程序/APP 端必须是完整 URL；H5 开发走 proxy 不需要）
// 使用 127.0.0.1 避免部分环境下 localhost 解析异常
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

// 用于 React Query 等缓存 Key 的 API Base 标识（避免切换后端/环境后仍复用旧缓存导致“修复后依然空列表”）
export function getApiBaseCacheKey(): string {
  try {
    const base = getBaseUrl();
    return base ? base : 'relative';
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
  // 以构建期注入的 env 为准，避免小程序端残留 Storage 配置导致“H5 正常、小程序命中错误后端/空库”
  const envBase = (process.env.TARO_APP_API_BASE || '').trim();
  if (envBase) return envBase;

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

  const shouldDebugLog =
    process.env.TARO_ENV === 'weapp' &&
    /\/api\/public\/hotels/.test(processedOptions.url) &&
    (process.env.NODE_ENV !== 'production' || isWeappDevtools());

  const normalizeSuccessData = (data: any, url: string): any => {
    let normalized = data;

    if (typeof normalized === 'string') {
      const trimmed = normalized.trim();
      if (!trimmed) return normalized;

      // 小程序端偶发把 JSON 当作字符串返回；这里兜底解析，避免“成功但列表为空”
      const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
      if (!looksLikeJson) {
        const snippet = trimmed.slice(0, 120).replace(/\s+/g, ' ');
        throw new Error(`接口返回非 JSON，请检查小程序请求地址/代理配置（请求：${url}，响应片段：${snippet}）`);
      }

      try {
        normalized = JSON.parse(trimmed);
      } catch {
        const snippet = trimmed.slice(0, 120).replace(/\s+/g, ' ');
        throw new Error(`接口 JSON 解析失败，请检查后端返回格式（请求：${url}，响应片段：${snippet}）`);
      }
    }

    // 某些代理/网关可能把错误包成 200；这里识别常见错误结构并转为异常
    if (normalized && typeof normalized === 'object') {
      const maybeStatusCode = (normalized as any).statusCode;
      if (typeof maybeStatusCode === 'number' && maybeStatusCode >= 400) {
        const message = Array.isArray((normalized as any).message)
          ? (normalized as any).message.join('; ')
          : (normalized as any).message;
        const err: any = new Error(message || `HTTP ${maybeStatusCode}`);
        err.statusCode = maybeStatusCode;
        err.data = normalized;
        throw err;
      }

      const errcode = (normalized as any).errcode;
      const errmsg = (normalized as any).errmsg;
      if (typeof errcode === 'number' && errcode !== 0) {
        const err: any = new Error(errmsg || `errcode ${errcode}`);
        err.code = errcode;
        err.data = normalized;
        throw err;
      }
    }

    return normalized;
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
      // 执行响应拦截器
      let result = normalizeSuccessData(res.data, url) as T;

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

    if (process.env.NODE_ENV !== 'production' || isWeappDevtools()) {
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
