const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const sentenceAudio = require('../../../behaviors/sentenceAudio')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const api = getApp().api

Page({
  behaviors: [pageGuard.behavior, pageLoading, sentenceAudio, buttonGroupHeight],
  data: {
    showPopup: false,
    seriesIndex: 0,
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
    wx.removeStorageSync('questionIdArr')
    this.destroySentenceAudio()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 播放/停止答案所有句子
  onFooterPlay(e) {
    const index = e.currentTarget.dataset.index
    if (e.detail.playing) {
      this.playAllSentences(index)
    } else {
      this.stopAllSentences(index)
    }
  },
  gotoStoryBlock(e) {
    let item = {
      type: 4,
      ...e.currentTarget.dataset
    }
    this.navigateTo('/pages/p2-block/block-group/index' + api.parseParams(item))
  },
  recordingOrClocking() {
    const { detail, seriesIndex, seriesList, color, backgroundColor, recordId } = this.data
    let itemList = ['仅打卡']
    let itemUrl = ['']
    itemList.push('录音')
    itemList.push('历史录音（' + this.data.recordingCount + '）条')
    let param = {
      type: 2,
      setId: this.options.setId,
      color: color,
      background: backgroundColor
    }
    param.recordType = 2
    itemUrl.push('/pages/recording/single-record/index' + api.parseParams(param))
    itemUrl.push('/pages/recording/p1p2p3-record-list/index' + api.parseParams(param))
    const _this = this
    wx.showActionSheet({
      itemList: itemList,
      success: ((res) => {
        if (res.tapIndex === 0) {
          _this.punching()
        } else {
          _this.navigateTo(itemUrl[res.tapIndex])
        }
      })
    })
  },
  toRecordList(param) {
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
  // 切换系列
  checkSeries(e) {
    const { seriesIndex } = this.data
    const checkIndex = e.currentTarget.dataset.index
    if (seriesIndex != checkIndex) {
      this.setData({
        seriesIndex: checkIndex
      })
      this.getStoryData()
    }
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
  // 置顶开关切换
  onTopSwitch(e) {
    const index = e.currentTarget.dataset.index
    const isPreferred = e.detail.value
    // TODO: 调用API保存置顶状态
    this.setData({
      [`list[${index}].isPreferred`]: isPreferred
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  getData(isPull) {
    const _this = this
    api.request(this, '/question/v3/detail', {
      setType: 2,
      ...this.data.queryParam
    }, isPull)
      .then(() => {
        _this.getStoryData(true)
        this.setDataReady()
        // 数据就绪后重新计算按钮组高度（此时 hint_banner 已渲染）
        this.updateButtonGroupHeight()
      })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => { this.finishLoading() })
  },
  getStoryData(isPull) {
    const { detail, seriesList, seriesIndex } = this.data
    let param = {
      setId: this.options.setId,
      id: detail.id,
    }
    if (seriesList.length > 0) {
      param['seriesId'] = seriesList[seriesIndex].id
    }
    api.request(this, '/question/v3/detail/story', param, isPull)
  },
  popupConfirm(e) {
    api.request(this, '/question/signIn', {
      resourceId: this.data.detail.id,
      type: 2,
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
