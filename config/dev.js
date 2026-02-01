// H5 开发直接请求后端（后端已配置 CORS 允许 10086）；小程序/RN 用完整 baseURL
const apiBase = '"http://localhost:3000"';

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
