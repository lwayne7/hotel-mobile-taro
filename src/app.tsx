import './app.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建 QueryClient 实例，配置全局默认值
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜，不重新请求
      gcTime: 30 * 60 * 1000, // 缓存保留30分钟
      retry: 2, // 失败重试2次
      refetchOnWindowFocus: false, // 窗口聚焦不自动刷新
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
