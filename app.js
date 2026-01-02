var api = require('/utils/api')
const pageGuard = require('./behaviors/pageGuard.js')
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
    // 缓存系统信息（避免同步调用阻塞）
    windowWidth: null,
    systemInfo: null,
    // 首页数据预加载缓存
    homeDataCache: null,
    popularScienceCache: null,
    // 加载阶段状态（用于首页显示加载提示）
    loadingStage: 'connecting',  // connecting | logging | ready
  },
  api: api,
  pageGuard: pageGuard,
  onShow: function () {
    // 标记从后台返回（用于页面判断是否需要刷新）
    this._fromBackground = true

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
  onHide: function () {
    // 记录进入后台的时间（可用于判断后台时长）
    this._hideTime = Date.now()
  },
  onLaunch() {
    // 记录启动时间（用于性能分析）
    this._launchTime = Date.now()
    console.log('[App] onLaunch 开始', new Date().toISOString())

    // 保持屏幕常亮 true / false
    if (wx.setScreenBrightness) {
      wx.setKeepScreenOn({ keepScreenOn: true });
    }

    // 预获取系统信息（异步，避免同步调用阻塞）
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.windowWidth = res.windowWidth
        this.globalData.systemInfo = res
      }
    })

    // 自动登录 + 首页数据预加载（并行执行）
    const loginPromise = this._doLogin()
    const preloadPromise = this._preloadHomeData()

    // 登录成功后触发首页加载
    loginPromise.then(() => {
      const elapsed = Date.now() - this._launchTime
      console.log(`[App] 登录流程完成，触发 userData.login = true，总耗时: ${elapsed}ms`)
      userData.login = true
    }).catch(err => {
      console.error('[App] 登录流程失败:', err)
    })
  },

  /**
   * 执行登录
   */
  _doLogin() {
    const startTime = Date.now()
    console.log('[Login] 开始登录流程')

    // 阶段1: 正在建立连接（初始状态）
    this.globalData.loadingStage = 'connecting'

    return wx.login().then(data => {
      const wxLoginTime = Date.now() - startTime
      console.log(`[Login] wx.login 完成，耗时: ${wxLoginTime}ms, code: ${data.code ? '已获取' : '获取失败'}`)

      // 阶段2: wx.login 完成，开始加载用户数据
      this.globalData.loadingStage = 'logging'
      const apiStartTime = Date.now()

      return api.request(this, '/user/v1/login', {
        code: data.code
      }, true, false).then(res => {
        const apiTime = Date.now() - apiStartTime
        const totalTime = Date.now() - startTime
        console.log(`[Login] /user/v1/login API 完成，API耗时: ${apiTime}ms, 总耗时: ${totalTime}ms`)

        // 阶段3: 登录 API 完成，即将完成
        this.globalData.loadingStage = 'ready'
        wx.setStorageSync('token', res.token)
        return res
      }).catch(err => {
        const apiTime = Date.now() - apiStartTime
        console.error(`[Login] /user/v1/login API 失败，耗时: ${apiTime}ms, 错误:`, err)
        throw err
      })
    }).catch(err => {
      const elapsed = Date.now() - startTime
      console.error(`[Login] wx.login 失败，耗时: ${elapsed}ms, 错误:`, err)
      throw err
    })
  },

  /**
   * 预加载首页数据（与登录并行，加快首页显示）
   */
  _preloadHomeData() {
    const baseUrl = 'https://speak.jingying.vip/api/mao'

    // 并行请求首页两个接口
    const homePromise = new Promise((resolve) => {
      wx.request({
        url: baseUrl + '/v2/home/list',
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.data && res.data.code == '200') {
            this.globalData.homeDataCache = res.data.data
          }
          resolve()
        },
        fail: () => resolve()
      })
    })

    const sciencePromise = new Promise((resolve) => {
      wx.request({
        url: baseUrl + '/popular/science/v1/miniapp/home',
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.data && res.data.code == '200') {
            this.globalData.popularScienceCache = res.data.data
          }
          resolve()
        },
        fail: () => resolve()
      })
    })

    return Promise.all([homePromise, sciencePromise])
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