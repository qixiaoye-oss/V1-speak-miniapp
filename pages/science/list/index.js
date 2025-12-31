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
    this.listData()
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listData()
  },
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 去往答题
  toDetail(e) {
    let item = e.currentTarget.dataset.item
    this.navigateTo(`../detail/index?id=${item.id}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listData() {
    api.request(this, '/popular/science/v1/miniapp/list', {}, true)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})