const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    dateLabel: {
      value: '',
      total: 0,
      title: ''
    }
  },
  // ===========生命周期 Start===========
  onLoad(options) { },
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
    this.navigateTo(`/pages/p3-block/block-group/index?setId=${item.id}&dateLabel=${this.data.dateLabel.value}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/set/v2/list', {
      albumId: this.options.id,
      albumType: 5,
      dateLabel: this.data.dateLabel.value
    }, isPull)
      .then(() => { this.setDataReady() })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
  // ===========切换时间标签 Start ===========
  listDateLabel() {
    api.request(this, '/material/citationsStatistics', { id: this.options.id }, false).then(res => {
      let dateLabelIndex = wx.getStorageSync('dateLabelIndex') || 0
      this.setData({
        dateLabelTitleList: res.dateLabelList.map(item => item.title + "（共" + item.total + "条）"),
        dateLabel: res.dateLabelList[dateLabelIndex]
      })
      this.listData(true);
    })
  },
  changeDateLabel() {
    let that = this
    wx.showActionSheet({
      itemList: that.data.dateLabelTitleList,
      success(res) {
        that.setData({
          dateLabel: that.data.dateLabelList[res.tapIndex],
        })
        wx.setStorageSync('dateLabelIndex', res.tapIndex)
        that.listData(true);
      }
    })
  }
  // ===========切换时间标签 Start ===========
})