// 开发环境配置：
// - 默认使用线上 Railway 后端，无需启动本地后端
// - 设置 TARO_APP_API_BASE=http://localhost:3000 可切换为本地后端
// - 小程序 / RN：直接使用完整 baseURL
// - H5：未显式设置时通过 devServer proxy 代理

const taroEnv = process.env.TARO_ENV || 'weapp';
const { getLanIp } = require('./getLanIp');

const DEFAULT_DEV_API_PORT = process.env.TARO_APP_API_PORT || '3000';
const RAILWAY_API_BASE = 'https://hotel-management-production-wayne.up.railway.app';

// 所有平台共享的"候选后端地址"
// 默认使用线上 Railway 后端，设置 TARO_APP_API_BASE=http://localhost:3000 可切换为本地后端
const explicitBase = (process.env.TARO_APP_API_BASE || '').trim();
const lanIp = getLanIp();
const lanBase = lanIp ? `http://${lanIp}:${DEFAULT_DEV_API_PORT}` : '';

const sharedDevApiBase = explicitBase || RAILWAY_API_BASE;

// H5：
// - 未显式 TARO_APP_API_BASE 时：保持空字符串，走 devServer proxy，避免 CORS 问题；
// - 显式配置 TARO_APP_API_BASE 时：与小程序 / RN 一起直接访问同一个后端。
const apiBase = taroEnv === 'h5' && !explicitBase ? '' : sharedDevApiBase;

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
