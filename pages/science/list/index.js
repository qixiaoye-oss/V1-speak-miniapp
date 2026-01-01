const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    const isFirstLoad = !this.data._hasLoaded

    // 从后台返回或从子页面返回，都不刷新（科普列表不需要刷新）
    if (!isFirstLoad) {
      return
    }

    // 首次加载：显示 loading
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
  // 去往答题
  toDetail(e) {
    let item = e.currentTarget.dataset.item
    this.navigateTo(`../detail/index?id=${item.id}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listData(showLoading) {
    const hasToast = !showLoading
    api.request(this, '/popular/science/v1/miniapp/list', {}, hasToast, 'GET', false)
      .then((res) => {
        diffSetData(this, res)
        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})