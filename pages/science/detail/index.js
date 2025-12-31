const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.listData()
  },
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========

  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listData() {
    api.request(this, `/popular/science/v1/detail/${this.options.id}`, {}, true)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})