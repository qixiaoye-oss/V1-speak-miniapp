const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    // 只首次加载，后续不刷新（科普列表是静态内容）
    if (this.data._hasLoaded) {
      return
    }
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
  toDetail(e) {
    let item = e.currentTarget.dataset.item
    this.navigateTo(`../detail/index?id=${item.id}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData() {
    api.request(this, '/popular/science/v1/miniapp/list', {}, false, 'GET', false)
      .then((res) => {
        this.setData(res)
        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})