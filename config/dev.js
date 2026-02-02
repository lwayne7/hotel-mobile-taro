// H5 开发使用 devServer proxy，小程序/RN 用完整 baseURL
// 可通过环境变量覆盖：TARO_APP_API_BASE="https://api.example.com" npm run dev:weapp

// 注意：config 文件在 Node.js 中执行，此时 TARO_ENV 已由 Taro CLI 设置
// H5: 不设置 API_BASE，使用 proxy 代理 /api/* 到后端
// 小程序/RN: 需要完整 URL
const taroEnv = process.env.TARO_ENV || 'weapp';
console.log('[dev.js] TARO_ENV:', taroEnv);

// H5 使用空字符串走代理，其他平台使用完整 URL
const defaultApiBase = taroEnv === 'h5' ? '' : 'http://127.0.0.1:3000';
const apiBase = process.env.TARO_APP_API_BASE || defaultApiBase;

module.exports = {
  env: {
    NODE_ENV: '"development"',
  },
  defineConstants: {
    // 注意：这里需要 JSON.stringify 包装字符串
    'process.env.TARO_APP_API_BASE': JSON.stringify(apiBase),
  },
  mini: {},
  h5: {},
  rn: {},
};
