import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// Mock Taro API
vi.mock('@tarojs/taro', () => ({
  default: {
    getEnv: () => 'WEB',
    ENV_TYPE: {
      WEAPP: 'WEAPP',
      WEB: 'WEB',
      RN: 'RN',
    },
    getStorageSync: vi.fn(() => null),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    getSystemInfoSync: vi.fn(() => ({
      platform: 'devtools',
      screenWidth: 375,
      screenHeight: 812,
      safeArea: { top: 44, bottom: 778, left: 0, right: 375 },
    })),
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    redirectTo: vi.fn(),
    showToast: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    request: vi.fn(),
  },
  getEnv: () => 'WEB',
  getStorageSync: vi.fn(() => null),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    platform: 'devtools',
    screenWidth: 375,
    screenHeight: 812,
    safeArea: { top: 44, bottom: 778, left: 0, right: 375 },
  })),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  redirectTo: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  request: vi.fn(),
  useRouter: vi.fn(() => ({ params: {} })),
}));

// Mock Taro Components
vi.mock('@tarojs/components', () => ({
  View: ({ children, className, style, onClick, ...props }: any) => (
    <div className={className} style={style} onClick={onClick} {...props}>
      {children}
    </div>
  ),
  Text: ({ children, className, style, onClick, ...props }: any) => (
    <span className={className} style={style} onClick={onClick} {...props}>
      {children}
    </span>
  ),
  Image: ({ src, className, style, mode, ...props }: any) => (
    <img src={src} className={className} style={style} {...props} />
  ),
  ScrollView: ({ children, className, style, ...props }: any) => (
    <div className={className} style={{ overflow: 'auto', ...style }} {...props}>
      {children}
    </div>
  ),
  Input: ({ value, onInput, placeholder, className, ...props }: any) => (
    <input
      value={value}
      onChange={(e) => onInput?.({ detail: { value: e.target.value } })}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  ),
  Button: ({ children, className, onClick, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Swiper: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  SwiperItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock process.env
vi.stubGlobal('process', {
  ...process,
  env: {
    ...process.env,
    TARO_ENV: 'h5',
    NODE_ENV: 'test',
  },
});
