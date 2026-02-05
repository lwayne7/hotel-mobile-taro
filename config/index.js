const path = require('path');
const { getLanIp } = require('./getLanIp');

const taroEnv = process.env.TARO_ENV || 'weapp';
const outputRoot =
    taroEnv === 'h5' ? 'dist-h5' : taroEnv === 'rn' ? 'dist-rn' : 'dist';

// 开发环境下的"后端候选地址"
// - 显式设置 TARO_APP_API_BASE 时，H5 proxy 与小程序/RN baseURL 会统一指向该地址
// - 未显式设置时：H5 默认代理到 localhost，小程序/RN 默认使用局域网 IP（config/dev.js）
const DEFAULT_DEV_API_PORT = process.env.TARO_APP_API_PORT || '3000';
const DEFAULT_LOCAL_API_BASE = `http://localhost:${DEFAULT_DEV_API_PORT}`;
const explicitBase = (process.env.TARO_APP_API_BASE || '').trim();
const lanIp = getLanIp();
const lanBase = lanIp ? `http://${lanIp}:${DEFAULT_DEV_API_PORT}` : '';
const sharedDevApiBase = explicitBase || (taroEnv === 'weapp' || taroEnv === 'rn' ? lanBase || DEFAULT_LOCAL_API_BASE : DEFAULT_LOCAL_API_BASE);

const config = {
    projectName: 'hotel-mobile-taro',
    date: '2026-2-1',
    designWidth: 750,
    deviceRatio: {
        640: 2.34 / 2,
        750: 1,
        828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot,
    plugins: [],
    defineConstants: {},
    copy: {
        patterns: [
            // 复制 project.miniapp.json 到 dist 目录，用于微信多端应用模式
            {
                from: path.resolve(__dirname, '..', 'project.miniapp.json'),
                to: 'project.miniapp.json',
            },
            // 复制 app.miniapp.json 到 dist 目录，用于微信多端应用模式
            {
                from: path.resolve(__dirname, '..', 'app.miniapp.json'),
                to: 'app.miniapp.json',
            },
        ],
        options: {},
    },
    framework: 'react',
    compiler: {
        type: 'webpack5',
        prebundle: {
            enable: true,
            // 排除 zod，避免在多端应用模式下预打包导致 wx 未定义错误
            // 使用正则表达式匹配包名
            exclude: [/^zod$/],
        },
    },
    cache: {
        enable: false,
    },
    mini: {
        postcss: {
            pxtransform: {
                enable: true,
                config: {},
            },
            url: {
                enable: true,
                config: {
                    limit: 1024,
                },
            },
            cssModules: {
                enable: false,
                config: {
                    namingPattern: 'module',
                    generateScopedName: '[name]__[local]___[hash:base64:5]',
                },
            },
        },
    },
    h5: {
        publicPath: '/',
        staticDirectory: 'static',
        postcss: {
            autoprefixer: {
                enable: true,
                config: {},
            },
            cssModules: {
                enable: false,
                config: {
                    namingPattern: 'module',
                    generateScopedName: '[name]__[local]___[hash:base64:5]',
                },
            },
        },
        devServer: {
            port: 10086,
            proxy: {
                '/api': {
                    target: sharedDevApiBase,
                    changeOrigin: true,
                },
            },
        },
    },
    rn: {
        appName: 'taroDemo',
        postcss: {
            cssModules: {
                enable: false,
            },
        },
    },
};

module.exports = function (merge) {
    if (process.env.NODE_ENV === 'development') {
        return merge({}, config, require('./dev'));
    }
    return merge({}, config, require('./prod'));
};
