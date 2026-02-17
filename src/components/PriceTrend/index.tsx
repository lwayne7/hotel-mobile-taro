/**
 * PriceTrend - 价格趋势折线图
 * 全像素定位，确保折线连续
 */
import { useMemo, useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

interface PriceTrendProps {
  currentPrice: number;
  hotelId: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >> 16) / 32768;
  };
}

const DAY_LABELS = ['-7', '-6', '-5', '-4', '-3', '-2', '昨天', '今天'];
const CHART_H = 80;
const PAD_Y = 12;
const MARGIN_LEFT = 40;
const MARGIN_RIGHT = 12;
const PAGE_PADDING = 16;

export function PriceTrend({ currentPrice, hotelId }: PriceTrendProps) {
  const [chartW, setChartW] = useState(260);

  useEffect(() => {
    try {
      const info = Taro.getSystemInfoSync();
      setChartW(info.windowWidth - PAGE_PADDING * 2 - MARGIN_LEFT - MARGIN_RIGHT);
    } catch {
      setChartW(260);
    }
  }, []);

  const { points, minP, maxP, trend } = useMemo(() => {
    const rng = seededRandom(hotelId * 31 + 7);
    const prices: number[] = [];
    for (let i = 0; i < 7; i++) {
      prices.push(Math.round(currentPrice * (0.88 + rng() * 0.24)));
    }
    prices.push(currentPrice);

    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    const range = hi - lo || 1;

    const pts = prices.map((p, i) => ({
      x: (i / (prices.length - 1)) * chartW,
      y: PAD_Y + ((hi - p) / range) * (CHART_H - PAD_Y * 2),
      price: p,
    }));

    const diff = currentPrice - prices[6];
    const t = diff < 0 ? 'down' : diff > 0 ? 'up' : 'stable';
    return { points: pts, minP: lo, maxP: hi, trend: t };
  }, [currentPrice, hotelId, chartW]);

  const trendColor = trend === 'down' ? '#52c41a' : trend === 'up' ? '#ff4d4f' : '#faad14';
  const trendText = trend === 'down' ? '较昨日下降' : trend === 'up' ? '较昨日上涨' : '与昨日持平';
  const lineColor = '#4096ff';

  return (
    <View style={{ padding: `${PAGE_PADDING}px`, background: '#fff', marginBottom: '8px' }}>
      <Text style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '12px' }}>
        近期价格走势
      </Text>

      <View style={{ display: 'flex', flexDirection: 'row' }}>
        {/* Y axis */}
        <View style={{
          width: `${MARGIN_LEFT}px`,
          height: `${CHART_H}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingRight: '4px',
        }}>
          <Text style={{ fontSize: '10px', color: '#bbb', textAlign: 'right' }}>¥{maxP}</Text>
          <Text style={{ fontSize: '10px', color: '#bbb', textAlign: 'right' }}>¥{minP}</Text>
        </View>

        {/* Chart body */}
        <View style={{
          width: `${chartW}px`,
          height: `${CHART_H}px`,
          position: 'relative',
          background: '#fafbfc',
          borderRadius: '8px',
          overflow: 'visible',
        }}>
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <View key={`g${i}`} style={{
              position: 'absolute',
              top: `${PAD_Y + i * ((CHART_H - PAD_Y * 2) / 3)}px`,
              left: 0, right: 0, height: '1px',
              background: '#f0f0f0',
            }} />
          ))}

          {/* Line segments - all in px, guaranteed continuous */}
          {points.slice(0, -1).map((a, i) => {
            const b = points[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View key={`ln${i}`} style={{
                position: 'absolute',
                left: `${a.x}px`,
                top: `${a.y}px`,
                width: `${len}px`,
                height: '2px',
                background: lineColor,
                transformOrigin: '0 50%',
                transform: `rotate(${angle}deg)`,
                zIndex: 1,
              }} />
            );
          })}

          {/* Dots */}
          {points.map((pt, i) => {
            const isLast = i === points.length - 1;
            const sz = isLast ? 10 : 6;
            return (
              <View key={`d${i}`} style={{
                position: 'absolute',
                left: `${pt.x - sz / 2}px`,
                top: `${pt.y - sz / 2}px`,
                width: `${sz}px`,
                height: `${sz}px`,
                borderRadius: '50%',
                background: isLast ? trendColor : lineColor,
                border: isLast ? `2px solid ${trendColor}44` : `1px solid #fff`,
                boxSizing: 'content-box',
                zIndex: 3,
              }} />
            );
          })}

          {/* Price label on last dot */}
          <Text style={{
            position: 'absolute',
            left: `${points[points.length - 1].x - 30}px`,
            top: `${points[points.length - 1].y - 20}px`,
            fontSize: '11px',
            fontWeight: '600',
            color: trendColor,
            zIndex: 4,
          }}>
            ¥{currentPrice}
          </Text>
        </View>
      </View>

      {/* X axis labels */}
      <View style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '6px',
        marginLeft: `${MARGIN_LEFT}px`,
        marginRight: `${MARGIN_RIGHT}px`,
      }}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
            {d}
          </Text>
        ))}
      </View>

      {/* Trend summary */}
      <View style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '6px',
        marginTop: '10px',
        marginLeft: `${MARGIN_LEFT}px`,
      }}>
        <View style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: trendColor,
        }} />
        <Text style={{ fontSize: '12px', color: '#666' }}>
          今日 ¥{currentPrice} {trendText}
        </Text>
      </View>
    </View>
  );
}
