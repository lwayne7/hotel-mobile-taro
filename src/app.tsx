import './app.scss';
import Taro from '@tarojs/taro';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';

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
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}

export default App;
