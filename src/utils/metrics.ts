import Taro from '@tarojs/taro';

interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

const metricsQueue: PerformanceMetric[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 记录性能指标。
 * 在开发环境打印到控制台，生产环境批量上报到后端 /api/v1/metrics/web-vitals 端点。
 */
export function reportMetric(metric: PerformanceMetric): void {
  metricsQueue.push(metric);

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[Perf] ${metric.name}: ${metric.value.toFixed(1)}ms (${metric.rating ?? 'n/a'})`,
    );
  }

  // 批量上报：积攒到 5 条或 5 秒后发送
  if (metricsQueue.length >= 5) {
    flushMetrics();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushMetrics, 5_000);
  }
}

function flushMetrics(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (metricsQueue.length === 0) return;

  const batch = metricsQueue.splice(0);

  // 使用 sendBeacon 或 fetch 上报（H5）/ Taro.request（小程序）
  const url = `${process.env.TARO_APP_API || ''}/api/v1/metrics/web-vitals`;

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, JSON.stringify({ metrics: batch }));
  } else {
    Taro.request({
      url,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { metrics: batch },
    }).catch(() => {
      // 静默失败，不影响用户体验
    });
  }
}

/**
 * 初始化 Web Vitals 采集（仅 H5 环境）。
 * 采集 FCP、LCP、CLS、FID、TTFB 五项核心指标。
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { onFCP, onLCP, onCLS, onFID, onTTFB } = await import('web-vitals');

    const handle = (name: string) => (entry: { value: number; rating: string }) => {
      reportMetric({
        name,
        value: entry.value,
        rating: entry.rating as PerformanceMetric['rating'],
        timestamp: Date.now(),
      });
    };

    onFCP(handle('FCP'));
    onLCP(handle('LCP'));
    onCLS(handle('CLS'));
    onFID(handle('FID'));
    onTTFB(handle('TTFB'));
  } catch {
    // web-vitals 不可用（非 H5 环境），静默忽略
  }
}
