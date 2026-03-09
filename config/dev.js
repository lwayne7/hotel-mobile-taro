// 开发环境配置：
// - 推荐本地 or 局域网 NestJS 后端，用于联调与调试
// - TARO_APP_API_BASE 优先（如 http://192.168.x.x:3000），否则自动选择局域网 IP，再否则 localhost:3000
// - H5：未显式设置 TARO_APP_API_BASE 时通过 devServer proxy 代理

const taroEnv = process.env.TARO_ENV || 'weapp';
const { getLanIp } = require('./getLanIp');

const DEFAULT_DEV_API_PORT = process.env.TARO_APP_API_PORT || '3000';

const explicitBase = (process.env.TARO_APP_API_BASE || '').trim();
const lanIp = getLanIp();
const lanBase = lanIp ? `http://${lanIp}:${DEFAULT_DEV_API_PORT}` : '';

// 所有平台共享的"候选后端地址"
// 优先显式 TARO_APP_API_BASE，其次局域网 IP，最后回退 localhost:3000
const sharedDevApiBase = explicitBase || lanBase || `http://localhost:${DEFAULT_DEV_API_PORT}`;

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
