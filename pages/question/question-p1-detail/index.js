const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const sentenceAudio = require('../../../behaviors/sentenceAudio')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const api = getApp().api

Page({
  behaviors: [pageGuard.behavior, pageLoading, sentenceAudio, buttonGroupHeight],
  data: {
    showPopup: false,  // 打卡窗口
    versionIndex: 0
  },
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.getData(true)
  },
  onLoad(options) {
    this.setData({
      queryParam: options
    })
    this.initSentenceAudio()
  },
  onUnload() {
    this.destroySentenceAudio()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 播放题目音频（扩展 behavior 的 playMainAudio）
  playMainAudio() {
    this.stopAudio()
    this.resetSentenceAudioStatus()
    const { audioUrl } = this.data.detail
    if (audioUrl) {
      this.playAudio(audioUrl)
    }
  },
  // 播放/停止答案所有句子
  onFooterPlay(e) {
    const index = e.currentTarget.dataset.index
    if (e.detail.playing) {
      this.playAllSentences(index)
    } else {
      this.stopAllSentences(index)
    }
  },
  // 单题录音或打卡
  recordingOrClocking() {
    const _this = this
    const recordingCount = this.data.recordingCount || 0
    wx.showActionSheet({
      itemList: ['仅打卡', '录音', '历史录音（' + recordingCount + '）条'],
      success: ((res) => {
        let param = {
          ...this.data.queryParam
        }
        if (res.tapIndex === 0) {
          _this.punching()
        }
        if (res.tapIndex === 1) {
          _this.toRecording(param)
        }
        if (res.tapIndex === 2) {
          _this.toRecordList(param)
        }
      })
    })
  },
  toRecording(param) {
    param.recordType = 1
    this.navigateTo('/pages/recording/single-record/index' + api.parseParams(param))
  },
  toRecordList(param) {
    param.type = 1
    this.navigateTo('/pages/recording/p1p2p3-record-list/index' + api.parseParams(param))
  },
  // 打卡
  punching() {
    this.setData({
      showPopup: true
    })
  },
  popupCancel() {
    this.setData({
      showPopup: false
    })
  },
  // 置顶开关切换
  onTopSwitch(e) {
    const index = e.currentTarget.dataset.index
    const { list } = this.data
    for (let i = 0; i < list.length; i++) {
      list[i].isPreferred = i === index ? e.detail.value : false
    }
    this.setData({
      list: list
    })
    this.updatePin(index)
  },
  // 切换版本
  checkVersion(e) {
    const { versionIndex } = this.data
    const checkIndex = e.detail.index
    if (versionIndex !== checkIndex) {
      this.setData({ versionIndex: checkIndex })
    }
  },
  // 切换灵感块展开/收起状态
  onInspirationToggle(e) {
    const { index, expanded } = e.detail
    this.setData({
      [`list[${index}].inspirationExpanded`]: expanded
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  getData(isPull) {
    const _this = this
    api.request(this, '/question/v2/detail', {
      setType: 1,
      ...this.data.queryParam
    }, isPull)
      .then(res => {
        this.setDataReady()
      })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => {
        this.finishLoading()
        // loading 结束后计算按钮组高度
        this.updateButtonGroupHeight()
      })
  },
  // 打卡请求
  popupConfirm(e) {
    api.request(this, '/question/signIn', {
      setId: this.options.setId,
      resourceId: this.data.detail.id,
      type: 1,
    }, false, "POST").then(res => {
      api.toast("打卡成功")
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    })
  },
  // 保存P1答案选中
  updatePin(index) {
    const { detail, list } = this.data
    api.request(this, '/v2/question/p1/answer/preferred', {
      questionId: detail.id,
      answerId: list[index].id,
      isPreferred: list[index].isPreferred
    }, false, "GET")
  },
  // ===========数据获取 End===========
})
