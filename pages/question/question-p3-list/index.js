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
  onUnload() {
    wx.removeStorageSync('questionIdArr')
  },
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toChildPage({ currentTarget: { dataset: { id, childTotal } } }) {
    if (childTotal == 0) {
      api.modal('', "本题暂无答案", false)
      return
    }
    let param = {
      setId: this.options.setId,
      id: id
    }
    this.navigateTo('/pages/question/question-p3-detail/index' + api.parseParams(param))
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/question/v2/p3/list', {
      setType: 3,
      ...this.options
    }, isPull)
      .then(res => {
        let idArr = []
        res.list.forEach(i => {
          idArr.push(i.id)
        })
        wx.setStorageSync('questionIdArr', idArr)
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  }
  // ===========数据获取 End===========
})