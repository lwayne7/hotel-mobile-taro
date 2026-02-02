// H5 开发直接请求后端（后端已配置 CORS 允许 10086）；小程序/RN 用完整 baseURL
// 可通过环境变量覆盖：TARO_APP_API_BASE="https://api.example.com" npm run dev:weapp
const apiBase = JSON.stringify(process.env.TARO_APP_API_BASE || 'http://127.0.0.1:3000');

module.exports = {
  env: {
    NODE_ENV: '"development"',
  },
  defineConstants: {
    'process.env.TARO_APP_API_BASE': apiBase,
  },
  mini: {},
  h5: {},
  rn: {},
};
