const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const sentenceAudio = require('../../../behaviors/sentenceAudio')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const api = getApp().api

Page({
  behaviors: [pageGuard.behavior, pageLoading, sentenceAudio, buttonGroupHeight],
  data: {
    showPopup: false,
    versionIndex: 0
  },
  // ===========生命周期 Start===========
  onShow() {
    // 如果是从图片预览返回，不重新加载页面
    if (getApp()._fromImagePreview) {
      getApp()._fromImagePreview = false
      return
    }
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
  // 切换版本
  checkVersion(e) {
    const { versionIndex } = this.data
    const checkIndex = e.detail.index
    if (versionIndex !== checkIndex) {
      this.setData({ versionIndex: checkIndex })
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
  recordingOrClocking() {
    const _this = this
    wx.showActionSheet({
      itemList: ['仅打卡', '录音', '历史录音（' + this.data.recordingCount + '）条'],
      success: ((res) => {
        let param = {
          type: 3,
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
    param.recordType = 3
    this.navigateTo('/pages/recording/single-record/index' + api.parseParams(param))
  },
  toRecordList(param) {
    const { backgroundColor, textColor } = this.data
    param.color = textColor || ''
    param.background = backgroundColor || ''
    this.navigateTo('/pages/recording/p1p2p3-record-list/index' + api.parseParams(param))
  },
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
  // 切换灵感块展开/收起状态
  onInspirationToggle(e) {
    const { index, expanded } = e.detail
    this.setData({
      [`list[${index}].inspirationExpanded`]: expanded
    })
  },
  // 置顶开关切换
  onTopSwitch(e) {
    const index = e.currentTarget.dataset.index
    const { list } = this.data
    // 互斥逻辑：只允许一个版本置顶
    for (let i = 0; i < list.length; i++) {
      list[i].isPreferred = i === index ? e.detail.value : false
    }
    this.setData({
      list: list
    })
    this.updatePin(index)
  },
  // 保存P3答案置顶状态
  updatePin(index) {
    const { detail, list } = this.data
    api.request(this, '/v2/question/p3/answer/preferred', {
      questionId: detail.id,
      answerId: list[index].id,
      isPreferred: list[index].isPreferred
    }, false, "GET")
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 查找置顶版本的索引
  findPreferredVersionIndex() {
    const { list } = this.data
    if (!list || list.length === 0) return 0
    const preferredIndex = list.findIndex(item => item.isPreferred === true)
    return preferredIndex >= 0 ? preferredIndex : 0
  },
  getData(isPull) {
    api.request(this, '/question/v2/detail', {
      setType: 3,
      ...this.data.queryParam
    }, isPull)
      .then(() => {
        // 自动定位到置顶版本
        const preferredIndex = this.findPreferredVersionIndex()
        if (preferredIndex !== this.data.versionIndex) {
          this.setData({ versionIndex: preferredIndex })
        }
        this.setDataReady()
        // 数据就绪后重新计算按钮组高度（此时 hint_banner 已渲染）
        this.updateButtonGroupHeight()
      })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => { this.finishLoading() })
  },
  popupConfirm(e) {
    api.request(this, '/question/signIn', {
      resourceId: this.data.detail.id,
      type: 3,
      setId: this.options.setId
    }, false, "POST").then(res => {
      api.toast("打卡成功")
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
    })
  },
  // ===========数据获取 End===========
})
