export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/hotel-list/index',
    'pages/hotel-detail/index',
    'pages/favorites/index',
    'pages/orders/index',
    'pages/login/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4facfe',
    navigationBarTitleText: '易宿',
    navigationBarTextStyle: 'white',
  },
  // 小程序定位权限说明（用于展示当前城市酒店）
  permission: {
    'scope.userLocation': {
      desc: '用于展示当前城市酒店',
    },
  },
  // 声明使用的隐私接口，否则 getLocation 会报错
  requiredPrivateInfos: ['getLocation'],
});
