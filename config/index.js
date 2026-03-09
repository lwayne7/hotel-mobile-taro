const path = require('path');
const { getLanIp } = require('./getLanIp');

const taroEnv = process.env.TARO_ENV || 'weapp';
const outputRoot =
    taroEnv === 'h5' ? 'dist-h5' : taroEnv === 'rn' ? 'dist-rn' : 'dist';

// 后端地址：
// - 开发环境：优先 TARO_APP_API_BASE，其次局域网 IP，最后回退到 http://localhost:3000
// - 线上（vercel）：由 vercel.json 中的 rewrites 代理到后端
const DEFAULT_DEV_API_PORT = process.env.TARO_APP_API_PORT || '3000';
const explicitBase = (process.env.TARO_APP_API_BASE || '').trim();
const lanIp = getLanIp();
const lanBase = lanIp ? `http://${lanIp}:${DEFAULT_DEV_API_PORT}` : '';
// 默认开发后端：本机或局域网 NestJS，而不是远程 Railway（避免远程环境 404/域名问题影响本地联调）
const sharedDevApiBase = explicitBase || lanBase || `http://localhost:${DEFAULT_DEV_API_PORT}`;

const config = {
    projectName: 'hotel-mobile-taro',
    date: '2026-2-1',
    designWidth: 375,
    deviceRatio: {
        375: 2,
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
            pxtransform: {
                enable: true,
                config: {
                    designWidth: 750,
                },
            },
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
