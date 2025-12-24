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
  toUnit(e) {
    // 判断是否开启了打卡权限
    const { item } = e.currentTarget.dataset
    this.toDetailPage(item)
  },
  // 去往详情页
  toDetailPage(item) {
    let param = api.parseParams({
      setId: this.options.setId,
      id: item.id,
    })
    this.navigateTo(`/pages/p3-block/block-detail/index${param}`)
  },
  toQuestionListPage(e) {
    const item = e.currentTarget.dataset
    this.navigateTo(`/pages/p3-block/link-question/index?id=${item.id}&dateLabel=${this.options.dateLabel}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/material/v2/list', {
      ...this.options
    }, isPull)
      .then(res => {
        let idBySort = res.list.flatMap(item => (item.list || []).map(subItem => subItem.id));
        wx.setStorageSync('materialIdBySort', idBySort)
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  }
  // ===========数据获取 End===========
})