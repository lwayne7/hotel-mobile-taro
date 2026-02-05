// 开发环境配置：
// - H5：默认使用 devServer proxy 代理 /api 到同一个后端；
// - 小程序 / RN：默认使用完整 baseURL；
// - 当显式配置 TARO_APP_API_BASE 时，三端统一使用同一个后端地址。

const taroEnv = process.env.TARO_ENV || 'weapp';
const { getLanIp } = require('./getLanIp');

const DEFAULT_DEV_API_PORT = process.env.TARO_APP_API_PORT || '3000';
const DEFAULT_LOCAL_API_BASE = `http://localhost:${DEFAULT_DEV_API_PORT}`;

// 所有平台共享的“候选后端地址”
// 默认：H5 走 proxy（目标为 localhost），小程序/RN 默认使用局域网 IP（真机可访问）
const explicitBase = (process.env.TARO_APP_API_BASE || '').trim();
const lanIp = getLanIp();
const lanBase = lanIp ? `http://${lanIp}:${DEFAULT_DEV_API_PORT}` : '';

const sharedDevApiBase = explicitBase || (taroEnv === 'weapp' || taroEnv === 'rn' ? lanBase || DEFAULT_LOCAL_API_BASE : DEFAULT_LOCAL_API_BASE);

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
