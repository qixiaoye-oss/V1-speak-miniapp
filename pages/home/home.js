const api = getApp().api
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const pageGuard = require('../../behaviors/pageGuard')
const smartLoading = require('../../behaviors/smartLoading')

// 加载阶段对应的提示文字
const LOADING_TEXTS = {
  connecting: '正在建立连接...',
  logging: '加载用户数据...',
  ready: '即将完成加载...'
}

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    url: {
      "P1": "/pages/question/set-p1-list/index",
      "P2": "/pages/question/set-p2p3-list/index",
      "POPULAR_SCIENCE": "/pages/science/list/index"
    },
    loadingText: LOADING_TEXTS.connecting
  },
  // ===========生命周期 Start===========
  onShow() {
    // 监听加载阶段变化
    this._watchLoadingStage()
  },

  onUnload() {
    // 清理定时器，防止内存泄漏
    this._clearLoadingStageTimer()
  },

  onShowLogin() {
    const app = getApp()

    // 清除加载阶段监听（登录已完成）
    this._clearLoadingStageTimer()

    // 首页只在首次加载时请求数据，后续不刷新（内容无需实时更新）
    const isFirstLoad = !this.data._hasLoaded
    if (!isFirstLoad) {
      return
    }

    // 优先使用预加载缓存（必须主数据缓存存在才使用，科普是可选的）
    if (app.globalData.homeDataCache) {
      this._useCachedData(app)
      return
    }

    // 首次加载 - 走正常加载流程
    this.startLoading()
    this.hideLoadError()
    this._loadAllData()
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
   * 监听加载阶段变化，更新提示文字
   */
  _watchLoadingStage() {
    // 如果已有数据，不需要监听
    if (this.data.list) {
      this._clearLoadingStageTimer()
      return
    }

    const app = getApp()
    // 立即更新一次
    this._updateLoadingText(app.globalData.loadingStage)

    // 启动定时器轮询
    this._loadingStageTimer = setInterval(() => {
      const stage = app.globalData.loadingStage
      this._updateLoadingText(stage)
    }, 100)
  },

  /**
   * 更新加载提示文字
   */
  _updateLoadingText(stage) {
    const text = LOADING_TEXTS[stage] || LOADING_TEXTS.connecting
    if (this.data.loadingText !== text) {
      this.setData({ loadingText: text })
    }
  },

  /**
   * 清除加载阶段监听定时器
   */
  _clearLoadingStageTimer() {
    if (this._loadingStageTimer) {
      clearInterval(this._loadingStageTimer)
      this._loadingStageTimer = null
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
  onMiniprogramLinkTap(e) {
    const type = e.currentTarget.dataset.type
    console.log('小程序跳转点击:', type)
    // TODO: 实现小程序跳转逻辑
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
