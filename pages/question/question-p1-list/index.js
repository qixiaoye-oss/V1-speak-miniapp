const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    hasMastered: false
  },
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
  onLoad(options) {
    this.setData({ hasMastered: options.hasMastered === 'true' })
  },
  onUnload() {
    wx.removeStorageSync('questionIdArr')
  },
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  switchChange(e) {
    this.setData({
      hasMastered: e.detail.value
    })
    this.saveMastered()
  },
  toChildPage({ currentTarget: { dataset: { id, childTotal } } }) {
    if (childTotal == 0) {
      api.modal('', "本题暂无答案", false)
      return
    }
    let param = {
      setId: this.options.setId,
      id: id
    }
    this.navigateTo('/pages/question/question-p1-detail/index' + api.parseParams(param))
  },
  recordingOrClocking() {
    // 判断是否所有题目都存在题目音频
    var emptyAudioCount = this.data.list.filter(function (item) {
      return api.isEmpty(item.audioUrl)
    }).length
    if (emptyAudioCount != 0) {
      api.toast("请联系小助手补充数据")
      return
    }
    // 整理跳转选项
    let menu = []
    let menuUrl = []
    // 判断是否开启带练模式
    // if (true) {
    //   menu.push('带练')
    //   menuUrl.push(`../recording-p1/index?setId=${this.options.setId}`)
    // }
    // if (this.data.practiceRecordId) {
    //   menu.push('带练结果')
    //   menuUrl.push(`../recording-p1-record/index?setId=${this.options.setId}&recordId=${this.data.practiceRecordId}`)
    // }
    let param = {
      type: 1,
      setId: this.options.setId,
    }
    menu.push('录音')
    menuUrl.push('/pages/recording/p1-multi-record/index' + api.parseParams(param))
    menu.push('历史录音')
    menuUrl.push('/pages/recording/p1-multi-record-list/index' + api.parseParams(param))

    const _this = this
    wx.showActionSheet({
      itemList: menu,
      success(res) {
        _this.navigateTo(menuUrl[res.tapIndex])
      }
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isPull) {
    api.request(this, '/question/v2/p1/list', {
      setType: 1,
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
  },
  saveMastered() {
    api.request(this, '/v2/unit/p1/update/mastered', {
      unitId: this.options.setId,
      isMastered: this.data.hasMastered
    }, 'false')
  }
  // ===========数据获取 End===========
})