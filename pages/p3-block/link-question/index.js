const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.hideLoadError()
    this.listData(true)
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listData(true)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toQuestionPage(e) {
    wx.removeStorageSync('questionIdArr')
    let param = {
      ...e.currentTarget.dataset
    }
    this.navigateTo('/pages/question/question-p3-detail/index' + api.parseParams(param))
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/material/v2/listLink', {
      ...this.options
    }, isPull)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  }
  // ===========数据获取 End===========
})