const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const audioListBehavior = require('../../../behaviors/audioListBehavior')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, audioListBehavior],
  data: {
    msg: ""
  },
  // ===========生命周期 Start===========
  onShow() { },
  onLoad(options) {
    this.startLoading()
    this.initAudioListBehavior()
    if (options.userId == this.data.user.id || this.data.user.isManager == 1) {
      this.fetchRecordingList(false)
    } else {
      api.modal("提示", '暂无权限', false)
      return
    }
  },
  onUnload() {
    this.destroyAudioListBehavior()
  },
  onShareAppMessage() {
    return api.share('考雅狂狂说', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toDetail(e) {
    this.navigateTo('../history-record-detail/index?id=' + e.currentTarget.dataset.id + '&mode=continuous')
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  fetchRecordingList(isPull) {
    this.hideLoadError()
    api.request(this, '/recording/list2Continuous', {
      ...this.options
    }, isPull).then(() => {
      this.setDataReady()
      this.finishLoading()
    }).catch(() => {
      pageGuard.showRetry(this)
    })
  },
  retryLoad() {
    this.startLoading()
    this.fetchRecordingList(false)
  },
  delRecording(id) {
    const _this = this
    api.request(this, '/recording/del2Continuous', {
      id: id
    }, true).then(() => {
      api.toast("删除成功")
      let timer = setTimeout(() => {
        _this.fetchRecordingList(false)
        clearTimeout(timer)
      }, 2000);
    })
  },
  // ===========数据获取 End===========
})
