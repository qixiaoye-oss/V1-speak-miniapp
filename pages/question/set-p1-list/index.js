const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    showMode: "full"
  },
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
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toUnit(e) {
    const { item } = e.currentTarget.dataset
    if (item.isInside == '0') {
      api.modal('', '暂未开通，请关注通知~', false)
      return
    }
    this.navigateTo(`/pages/question/question-p1-list/index?setId=${item.id}&hasMastered=${item.hasMastered}`)
  },
  onModeChange(e) {
    this.setData({
      showMode: e.detail.mode
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/set/v2/list', {
      albumId: this.options.id,
      albumType: 1,
    }, isPull)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})