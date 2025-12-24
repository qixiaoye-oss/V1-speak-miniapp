const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const api = getApp().api

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.getData(true)
  },
  onLoad(options) {
    this.setData({
      queryParam: options
    })
  },
  onUnload() { },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  getData(isPull) {
    api.request(this, '/recording/getWordDetail', {
      ...this.data.queryParam
    }, isPull)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})