const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const audioListBehavior = require('../../../behaviors/audioListBehavior')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

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
  behaviors: [pageGuard.behavior, pageLoading, loadError, audioListBehavior, smartLoading],
  data: {
    msg: "",
    type: 2
  },
  // ===========生命周期 Start===========
  onShow() {
    const isFirstLoad = !this.data._hasLoaded

    // 从后台返回，不刷新
    if (!isFirstLoad && this.isFromBackground()) {
      return
    }

    // 首次加载：显示 loading
    if (isFirstLoad) {
      this.startLoading()
      this.fetchRecordingList(true)
    } else {
      // 从子页面返回：静默刷新
      this.fetchRecordingList(false)
    }
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
      // 录音列表数据由 onShow 加载
    } else {
      api.modal("提示", '暂无权限', false)
      return
    }
  },
  onUnload() {
    this.destroyAudioListBehavior()
  },
  // 录音单元格事件处理
  onCellDetail(e) {
    this.navigateTo('../history-record-detail/index?id=' + e.detail.id + '&mode=single')
  },
  onCellPlay(e) {
    const { index, playing } = e.detail
    if (playing) {
      // 构造 playRecording 需要的事件对象
      this.playRecording({ currentTarget: { dataset: { index } } })
    } else {
      this.stopAudio()
    }
  },
  onCellSetting(e) {
    this.audioBtn({ currentTarget: { dataset: { id: e.detail.id } } })
  },
  // ===========生命周期 End===========
  // ===========数据获取 Start===========
  fetchQuestionDetail(isPull) {
    const config = apiConfig[this.data.type]
    api.request(this, config.detail, {
      ...this.options
    }, isPull)
  },
  fetchRecordingList(showLoading) {
    this.hideLoadError()
    const hasToast = !showLoading
    const config = apiConfig[this.data.type]
    api.request(this, config.list, config.listParam(this.options), hasToast, 'GET', false)
      .then((res) => {
        diffSetData(this, res)
        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  retryLoad() {
    this.startLoading()
    this.fetchRecordingList(true)
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
