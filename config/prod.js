module.exports = {
  env: {
    NODE_ENV: '"production"',
  },
  defineConstants: {
    'process.env.TARO_APP_API_BASE': JSON.stringify('https://hotel-management-production-wayne.up.railway.app'),
  },
  mini: {},
  rn: {},
  h5: {
    publicPath: '/',
    /**
     * WebpackChain 插件配置
     * @docs https://github.com/neutrinojs/webpack-chain
     */
    // webpackChain (chain) {
    //   /**
    //    * 如果 h5 端编译后体积过大，可以使用 webpack-bundle-analyzer 插件对打包体积进行分析。
    //    * @docs https://github.com/webpack-contrib/webpack-bundle-analyzer
    //    */
    //   chain.plugin('analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, []);
    //   return chain;
    // },
  },
};
