const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const audioListBehavior = require('../../../behaviors/audioListBehavior')

// 根据 type 配置不同的 API
const apiConfig = {
  1: {
    detail: '/v2/p1/detail',
    list: '/recording/list',
    del: '/recording/del',
    listParam: (options) => ({ ...options })
  },
  2: {
    detail: '/question/detailNoAnswer',
    list: '/recording/list',
    del: '/recording/del',
    listParam: (options) => ({ ...options })
  },
  3: {
    detail: '/question/detailNoAnswer',
    list: '/recording/list',
    del: '/recording/del',
    listParam: (options) => ({ ...options })
  }
}

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, audioListBehavior],
  data: {
    msg: "",
    type: 2
  },
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.fetchRecordingList(false)
  },
  onLoad(options) {
    const type = parseInt(options.type) || 2
    this.setData({
      type: type,
      color: options.color || '',
      background: options.background || ''
    })
    this.initAudioListBehavior()
    const user = this.data.user || {}
    if (options.userId == user.id || user.isManager == 1) {
      this.fetchQuestionDetail(true)
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
  toDetail(e) {
    this.navigateTo('../history-record-detail/index?id=' + e.currentTarget.dataset.id + '&mode=single')
  },
  // ===========生命周期 End===========
  // ===========数据获取 Start===========
  fetchQuestionDetail(isPull) {
    const config = apiConfig[this.data.type]
    api.request(this, config.detail, {
      ...this.options
    }, isPull)
  },
  fetchRecordingList(isPull) {
    this.hideLoadError()
    const config = apiConfig[this.data.type]
    api.request(this, config.list, config.listParam(this.options), isPull).then(() => {
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
    const config = apiConfig[this.data.type]
    api.request(this, config.del, {
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
