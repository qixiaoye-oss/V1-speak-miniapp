const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    dateLabel: ''
  },
  // ===========生命周期 Start===========
  onLoad(options) {
  },
  onShow() {
    this.startLoading()
    this.hideLoadError()
    this.listDateLabel()
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listDateLabel()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toUnit(e) {
    console.log(e)
    const { item } = e.currentTarget.dataset
    if (item.isInside == '0') {
      api.modal('', '暂未开通，请关注通知~', false)
      return
    }
    this.navigateTo(`/pages/p2-block/block-group/index?setId=${item.id}&dateLabel=${this.data.dateLabel}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/set/v2/list', {
      albumId: this.options.id,
      albumType: 4,
      dateLabel: this.data.dateLabel
    }, isPull)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
  // ===========获取默认时间标签 Start ===========
  listDateLabel() {
    api.request(this, '/story/citationsStatistics', { id: this.options.id }, false).then(res => {
      this.setData({
        dateLabel: res.dateLabelList[0]?.value || ''
      })
      this.listData(true)
    })
  }
  // ===========获取默认时间标签 End ===========
})