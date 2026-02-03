const { mergeConfig, getDefaultConfig } = require('@react-native/metro-config');
const { getMetroConfig } = require('@tarojs/rn-supporter');

module.exports = (async function () {
  const defaultConfig = getDefaultConfig(__dirname);
  const baseConfig = await getMetroConfig();

  const mergedBaseConfig = mergeConfig(defaultConfig, baseConfig);

  return mergeConfig(mergedBaseConfig, {
    // custom your metro config here
    // https://facebook.github.io/metro/docs/configuration
    resolver: {},
    transformer: {
      babelTransformerPath: require.resolve('./metro.taroTransformer.js'),
    },
  });
})();
