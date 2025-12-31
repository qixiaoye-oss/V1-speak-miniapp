const api = getApp().api
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const pageGuard = require('../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
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
    // 计算响应式布局标志
    const systemInfo = wx.getSystemInfoSync()
    const windowWidth = systemInfo.windowWidth
    // 判断是否为宽屏模式（如平板或横屏）
    const isWideScreen = windowWidth >= 768
    this.setData({
      isWideScreen: isWideScreen,
      windowWidth: windowWidth
    })
  },
  onShowLogin() {
    this.startLoading()
    this.hideLoadError()
    this.listPopularScienceData()
    this.listData(false)
      .then(() => {
        this.setDataReady()
      })
      .catch(() => {
        pageGuard.showRetry(this)
      })
      .finally(() => {
        this.finishLoading()
      })
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listData(false)
      .then(() => {
        this.setDataReady()
      })
      .catch(() => {
        pageGuard.showRetry(this)
      })
      .finally(() => {
        this.finishLoading()
      })
  },
  onShareAppMessage() {
    return api.share('考雅狂狂说', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toChildPage(e) {
    let isInside = e.currentTarget.dataset.isInside
    if (isInside === '0') {
      this.listPopularScienceByModule()
    }else{
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
  onNoticeTap() {
    // 点击说明徽章（暂未连接API）
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    return api.request(this, '/v2/home/list', {}, isPull)
  },
  listPopularScienceData(isPull) {
    return api.request(this, '/popular/science/v1/miniapp/home', {}, isPull)
  },
  listPopularScienceByModule() {
    api.request(this, '/popular/science/v1/list/no_permission', {}, true).then(res=>{
      const list = res.popularScienceList || []
      if (list.length == 1){
        this.navigateTo(`/pages/science/detail/index?id=${list[0].id}`)
      }
    })
  },
  // ===========数据获取 End===========
})