const api = getApp().api
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const pageGuard = require('../../behaviors/pageGuard')
const smartLoading = require('../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    url: {
      "P1": "/pages/question/set-p1-list/index",
      "P2": "/pages/question/set-p2p3-list/index",
      "STORY": "/pages/p2-block/set-list/index",
      "MATERIAL": "/pages/p3-block/set-list/index",
      "POPULAR_SCIENCE": "/pages/science/list/index"
    }
  },
  // ===========生命周期 Start===========
  onShow() {
    // 更新响应式布局（使用缓存的系统信息，避免同步调用阻塞）
    this._updateScreenLayout()
  },

  onShowLogin() {
    const app = getApp()

    // 从后台返回，不刷新
    if (this.isFromBackground()) {
      return
    }

    // 优先使用预加载缓存（app.js 在 onLaunch 时已预加载）
    if (app.globalData.homeDataCache || app.globalData.popularScienceCache) {
      this._useCachedData(app)
      return
    }

    // 首次加载或需要刷新
    if (this.shouldLoad()) {
      this.startLoading()
      this.hideLoadError()
      this._loadAllData()
    }
  },

  /**
   * 使用预加载的缓存数据
   */
  _useCachedData(app) {
    const updateData = {}

    if (app.globalData.popularScienceCache) {
      Object.assign(updateData, app.globalData.popularScienceCache)
      app.globalData.popularScienceCache = null  // 清除缓存
    }

    if (app.globalData.homeDataCache) {
      Object.assign(updateData, app.globalData.homeDataCache)
      app.globalData.homeDataCache = null  // 清除缓存
    }

    if (Object.keys(updateData).length > 0) {
      this.setData(updateData)
    }
    this.setDataReady()
    this.markLoaded()
  },

  /**
   * 并行加载所有数据
   */
  _loadAllData() {
    // 并行请求两个接口，禁用自动 setData，手动合并数据
    const promises = [
      api.request(this, '/popular/science/v1/miniapp/home', {}, true, 'GET', false)
        .catch(() => ({})),  // 科普数据加载失败不影响整体
      api.request(this, '/v2/home/list', {}, true, 'GET', false)
    ]

    Promise.all(promises)
      .then(([scienceData, homeData]) => {
        // 合并数据，只调用一次 setData
        this.setData({
          ...scienceData,
          ...homeData
        })
        this.setDataReady()
        this.markLoaded()
      })
      .catch(() => {
        pageGuard.showRetry(this)
      })
      .finally(() => {
        this.finishLoading()
      })
  },

  /**
   * 更新屏幕布局（异步，使用缓存）
   */
  _updateScreenLayout() {
    const app = getApp()
    const cachedWidth = app.globalData.windowWidth

    if (cachedWidth) {
      this._applyLayout(cachedWidth)
    } else {
      // 缓存未就绪，异步获取
      wx.getSystemInfo({
        success: (res) => {
          app.globalData.windowWidth = res.windowWidth
          this._applyLayout(res.windowWidth)
        }
      })
    }
  },

  /**
   * 应用布局设置
   */
  _applyLayout(windowWidth) {
    const isWideScreen = windowWidth >= 768
    // 只在值变化时才 setData
    if (this.data.isWideScreen !== isWideScreen || this.data.windowWidth !== windowWidth) {
      this.setData({
        isWideScreen: isWideScreen,
        windowWidth: windowWidth
      })
    }
  },

  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this._loadAllData()
  },

  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toChildPage(e) {
    let isInside = e.currentTarget.dataset.isInside
    if (isInside === '0') {
      this._listPopularScienceByModule()
    } else {
      const { url } = this.data
      const item = e.currentTarget.dataset
      // 根据不同类型进入不同页面
      wx.navigateTo({
        url: `${url[item.type]}?id=${item.id}`
      })
    }
  },
  toPopularSciencePage(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/science/detail/index?id=${id}`,
    })
  },
  toPopularScienceListPage() {
    wx.navigateTo({
      url: `/pages/science/list/index`,
    })
  },
  onNoticeTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/science/detail/index?id=${id}`,
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  /**
   * @deprecated 使用 _loadAllData 替代
   */
  listData(isPull) {
    return api.request(this, '/v2/home/list', {}, isPull)
  },
  /**
   * @deprecated 使用 _loadAllData 替代
   */
  listPopularScienceData(isPull) {
    return api.request(this, '/popular/science/v1/miniapp/home', {}, isPull)
  },
  _listPopularScienceByModule() {
    api.request(this, '/popular/science/v1/list/no_permission', {}, true).then(res => {
      const list = res.popularScienceList || []
      if (list.length == 1) {
        this.navigateTo(`/pages/science/detail/index?id=${list[0].id}`)
      }
    })
  },
  // ===========数据获取 End===========
})
