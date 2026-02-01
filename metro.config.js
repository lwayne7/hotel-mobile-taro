const { mergeConfig } = require('metro-config');
const { getMetroConfig } = require('@tarojs/rn-supporter');

module.exports = (async function () {
  const baseConfig = await getMetroConfig();
  return mergeConfig(baseConfig, {
    // custom your metro config here
    // https://facebook.github.io/metro/docs/configuration
    resolver: {},
    transformer: {
      ...baseConfig.transformer,
      babelTransformerPath: require.resolve('./metro.taroTransformer.js'),
    },
  });
})();
