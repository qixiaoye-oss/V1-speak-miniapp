const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const sentenceAudio = require('../../../behaviors/sentenceAudio')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const smartLoading = require('../../../behaviors/smartLoading')
const scoreFilter = require('../../../behaviors/scoreFilter')
const { diffSetData } = require('../../../utils/diff')
const api = getApp().api

Page({
  behaviors: [pageGuard.behavior, pageLoading, sentenceAudio, buttonGroupHeight, smartLoading, scoreFilter],
  data: {
    showPopup: false,
    versionIndex: 0,
  },
  // ===========生命周期 Start===========
  onShow() {
    // 如果是从图片预览返回，不重新加载页面
    if (getApp()._fromImagePreview) {
      getApp()._fromImagePreview = false
      return
    }

    const isFirstLoad = !this.data._hasLoaded

    // 从后台返回，不刷新
    if (!isFirstLoad && this.isFromBackground()) {
      return
    }

    // 首次加载：显示 loading
    if (isFirstLoad) {
      this.startLoading()
      this.getData(true)
    } else {
      // 从子页面（录音页）返回：静默刷新
      this.getData(false)
    }
  },
  onLoad(options) {
    // 读取用户默认难度设置
    const difficultySpeak = wx.getStorageSync('difficultySpeak') || '6.5'
    this.setData({
      queryParam: options,
      scoreFilter: String(difficultySpeak)
    })
    this.initSentenceAudio()
    this.getDifficultyList()
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
      // 切换前打断音频
      this.interruptAudio()
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
    this.syncPreferredToRawList()
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
  getData(showLoading) {
    const hasToast = !showLoading
    api.request(this, '/question/v2/detail', {
      setType: 3,
      ...this.data.queryParam
    }, hasToast, 'GET', false)
      .then((res) => {
        // 保存原始列表用于筛选
        if (res.list) {
          this.setData({ rawList: res.list })
        }
        diffSetData(this, res)
        // 检测是否只有通用版本（决定是否禁用筛选按钮）
        this.checkScoreFilterDisabled()
        // 校验并修正 scoreFilter，然后过滤数据
        this.validateAndFilter()

        // 自动定位到置顶版本
        const preferredIndex = this.findPreferredVersionIndex()
        if (preferredIndex !== this.data.versionIndex) {
          this.setData({ versionIndex: preferredIndex })
        }

        this.markLoaded()
        this.setDataReady()
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
