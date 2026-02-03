const { merge } = require('lodash');
const path = require('path');
const metroTransformer = require('@react-native/metro-babel-transformer');

const { getBabelConfig } = require('@tarojs/rn-supporter/dist/babel');
const defaults = require('@tarojs/rn-supporter/dist/defaults');
const { getProjectConfig } = require('@tarojs/rn-supporter/dist/utils');

const normalizeEntryFilePath = defaults.entryFilePath.replace(/\//g, path.sep);

const getTransformer = (pkgName) => require(pkgName);

function shouldApplyTaroPlugins(filename, options, config) {
  const sep = path.sep;
  const projectRoot = options.projectRoot || process.cwd();
  const sourceRoot = (config && config.sourceRoot) || 'src';
  const srcRoot = path.join(projectRoot, sourceRoot) + sep;
  const inSrc = filename.startsWith(srcRoot);
  const inTaroPkg = filename.includes(`${sep}node_modules${sep}@tarojs${sep}`);
  return inSrc || inTaroPkg;
}

async function transform({ src, filename, options }) {
  const config = await getProjectConfig();
  const rnConfig = (config && config.rn) || {};
  const entry = (rnConfig && rnConfig.entry) || 'app';
  const isConfigFile = /\.config\.(t|j)sx?$/.test(filename);

  const { plugins: taroPlugins } = getBabelConfig(config, isConfigFile);
  const plugins = shouldApplyTaroPlugins(filename, options, config) ? taroPlugins : [];

  const rules = [
    {
      test: /\.(css|scss|sass|less|styl|stylus|pcss)/,
      transformer: '@tarojs/rn-style-transformer',
      configOpt: { config },
    },
    {
      test: /\.(svg|svgx)/,
      transformer: 'react-native-svg-transformer',
    },
    {
      test: /\.(png|jpg|jpeg|bmp)/,
      transformer: '',
    },
    {
      test: /\.(js|ts|jsx|tsx)/,
      transformer: '@tarojs/rn-transformer',
      configOpt: {
        entry,
        sourceRoot: config && config.sourceRoot,
        appName: rnConfig.appName,
        designWidth: rnConfig.designWidth || config.designWidth,
        deviceRatio: rnConfig.deviceRatio || config.deviceRatio,
        nextTransformer: metroTransformer.transform,
        isEntryFile: (filename_) => filename_.includes(normalizeEntryFilePath),
        isConfigFile,
        plugins,
        rn: rnConfig,
      },
    },
  ];

  for (const rule of rules) {
    if (!rule.transformer) continue;
    const match = filename.match(rule.test);
    if (match && match.length) {
      const mixOptions = merge({}, options, rule.configOpt);
      return getTransformer(rule.transformer).transform({ src, filename, options: mixOptions });
    }
  }

  return metroTransformer.transform({ src, filename, options });
}

module.exports = {
  transform,
  getCacheKey: metroTransformer.getCacheKey,
};

