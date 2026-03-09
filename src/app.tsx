import './app.scss';
import Taro from '@tarojs/taro';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';

// 小程序/RN 下让 React Query 正确感知在线，避免 paused 导致不发请求
if (process.env.TARO_ENV === 'weapp' || process.env.TARO_ENV === 'rn') {
  onlineManager.setEventListener((setOnline) => {
    let disposed = false;
    const updateOnline = (isOnline: boolean) => {
      if (disposed) return;
      setOnline(!!isOnline);
    };
    updateOnline(true);
    try {
      const maybePromise = (Taro as any).getNetworkType?.();
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise
          .then((res: any) => updateOnline(res?.networkType && res.networkType !== 'none'))
          .catch(() => updateOnline(true));
      }
    } catch {
      // ignore
    }

    const handler = (res: any) => {
      if (typeof res?.isConnected === 'boolean') updateOnline(res.isConnected);
    };

    try {
      (Taro as any).onNetworkStatusChange?.(handler);
    } catch {
      // ignore
    }

    return () => {
      disposed = true;
      try {
        (Taro as any).offNetworkStatusChange?.(handler);
      } catch {
        // ignore
      }
    };
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      refetchOnMount:
        process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'weapp' ? 'always' : true,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App(props: React.PropsWithChildren) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// H5 端采集 Web Vitals 性能指标（FCP / LCP / CLS）
// 仅在 H5 + 非测试环境下加载，不影响小程序/RN 包体积
if (process.env.TARO_ENV === 'h5' && process.env.NODE_ENV !== 'test') {
  import('web-vitals').then(({ onFCP, onLCP, onCLS }) => {
    const report = (metric: { name: string; value: number }) => {
      // eslint-disable-next-line no-console
      console.log(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)}`);
    };
    onFCP(report);
    onLCP(report);
    onCLS(report);
  }).catch(() => {
    // web-vitals 不可用时静默降级
  });
}

export default App;
