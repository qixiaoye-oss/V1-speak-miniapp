var api = require('/utils/api')
const CustomHook = require('spa-custom-hooks')
let userData = {
  login: false
}
CustomHook.install({
  'Login': {
    name: 'Login',
    watchKey: 'login',
    deep: true,
    onUpdate(val) {
      return val;
    }
  }
}, userData)
App({
  globalData: {
    // 全局录音管理器
    recorderManager: null,
    // 全局音频播放器
    audioContext: null,
    // 每个页面可以注册自己专属的录音/音频事件处理函数
    pageEventHandlers: new Map(), // key: 页面路由, value: { onRecorderStart, onRecorderStop, ... }
  },
  api: api,
  onShow: function () {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            api.modal('更新提示', '新版本已经准备好，是否重启应用？', false).then(res => {
              updateManager.applyUpdate()
            })
          })
          updateManager.onUpdateFailed(function () {
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~'
            })
          })
        }
      })
    } else {
      api.modal('提示', '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。', false)
    }
  },
  onLaunch() {
    // 保持屏幕常亮 true / false
    if (wx.setScreenBrightness) {
      wx.setKeepScreenOn({ keepScreenOn: true });
    }
    // 自动登录
    wx.login().then(data => {
      api.request(this, '/user/v1/login', {
        code: data.code
      }, true, false).then(res => {
        wx.setStorageSync('token', res.token)
        userData.login = true
      })
    })
    // 初始化全局录音管理器
    // const recorderManager = wx.getRecorderManager();
    // this.globalData.recorderManager = recorderManager;
    // 录音器监听
    // recorderManager.onStart(() => {
    //   this._triggerPageHandler('onRecorderStart');
    // });

    // recorderManager.onStop((res) => {
    //   this._triggerPageHandler('onRecorderStop', res);
    // });

    // recorderManager.onError((err) => {
    //   this._triggerPageHandler('onRecorderError', err);
    // });

    // recorderManager.onPause(() => {
    //   this._triggerPageHandler('onRecorderPause');
    // });

    // recorderManager.onResume(() => {
    //   this._triggerPageHandler('onRecorderResume');
    // });
    // 初始化全局音频播放器
    // const audioContext = wx.createInnerAudioContext();
    // this.globalData.audioContext = audioContext;
    // 音频播放器监听
    // audioContext.onPlay(() => {
    //   this._triggerPageHandler('onAudioPlay');
    // });

    // audioContext.onPause(() => {
    //   this._triggerPageHandler('onAudioPause');
    // });

    // audioContext.onStop(() => {
    //   this._triggerPageHandler('onAudioStop');
    // });

    // audioContext.onEnded(() => {
    //   this._triggerPageHandler('onAudioEnded');
    // });

    // audioContext.onError((err) => {
    //   this._triggerPageHandler('onAudioError', err);
    // });

    // audioContext.onCanplay(() => {
    //   this._triggerPageHandler('onAudioCanplay');
    // });
  },

  /**
   * 触发当前页面注册的对应事件处理函数
   * @param {string} handlerName 如 'onRecorderStart'
   * @param {*} data 附加的数据，比如录音结果 res
   */
  _triggerPageHandler(handlerName, data) {
    const currentPage = getCurrentPages().pop(); // 获取当前页面实例
    if (!currentPage) return;

    const route = currentPage.route; // 如 'pages/practice/recording-v2/index'
    const handlers = this.globalData.pageEventHandlers.get(route);
    if (!handlers || typeof handlers[handlerName] !== 'function') return;

    // 调用当前页面的对应事件处理函数，并传入数据
    handlers[handlerName].call(currentPage, data);
  },

  /**
   * 注册当前页面的事件处理器（由页面 onLoad 或 onShow 调用）
   * @param {Object} handlers 如 { onRecorderStart() {...}, onAudioEnd() {...} }
   */
  registerPageEventHandlers(handlers) {
    const currentPage = getCurrentPages().pop();
    if (!currentPage) return;

    const route = currentPage.route;
    this.globalData.pageEventHandlers.set(route, handlers);
  },

  /**
   * 清除当前页面的事件处理器（由页面 onUnload 调用）
   */
  unregisterPageEventHandlers() {
    const currentPage = getCurrentPages().pop();
    if (!currentPage) return;

    const route = currentPage.route;
    this.globalData.pageEventHandlers.delete(route);
  },
})