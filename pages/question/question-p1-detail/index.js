const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const sentenceAudio = require('../../../behaviors/sentenceAudio')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')
const api = getApp().api

Page({
  behaviors: [pageGuard.behavior, pageLoading, sentenceAudio, buttonGroupHeight, smartLoading],
  data: {
    showPopup: false,  // 打卡窗口
    versionIndex: 0,
    scoreFilter: '6',           // 当前筛选值，默认6分版
    scoreFilterText: '6分版',   // 按钮显示文字
    rawList: [],                // 原始答案列表（未筛选）
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
      // 从子页面（录音页）返回：静默刷新（录音计数需要更新）
      this.getData(false)
    }
  },
  onLoad(options) {
    // 读取用户默认难度设置
    const difficultySpeak = wx.getStorageSync('difficultySpeak') || '6'
    const difficultyTextMap = { '6': '6分版', '7': '7分版', '8': '8分版' }
    this.setData({
      queryParam: options,
      scoreFilter: difficultySpeak,
      scoreFilterText: difficultyTextMap[difficultySpeak] || '6分版'
    })
    this.initSentenceAudio()
  },
  onUnload() {
    this.destroySentenceAudio()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 分数筛选按钮点击
  onScoreFilterTap() {
    const _this = this
    wx.showActionSheet({
      itemList: ['6分版', '7分版', '8分版'],
      success(res) {
        const options = ['6', '7', '8']
        const texts = ['6分版', '7分版', '8分版']
        const scoreFilter = options[res.tapIndex]
        _this.setData({
          scoreFilter,
          scoreFilterText: texts[res.tapIndex]
        })
        // 根据新筛选值重新过滤数据
        _this.filterAndSetList()
      }
    })
  },
  // 根据 scoreFilter 过滤答案列表
  filterAndSetList() {
    const { rawList, scoreFilter } = this.data
    if (!rawList || rawList.length === 0) return

    // 过滤：保留匹配版本 + 通用版本
    const filteredList = rawList.filter(item => {
      if (item.difficulty === 'general') return true
      return item.difficulty === scoreFilter
    })

    this.setData({ list: filteredList, versionIndex: 0 })
  },
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
    const { detail } = this.data
    param.type = 1
    param.id = detail.id  // 使用 detail.id 而不是 queryParam.id
    param.color = detail.questionBorderColor || ''
    param.background = detail.questionBackgroundColor || ''
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
  // 查找置顶版本的索引
  findPreferredVersionIndex() {
    const { list } = this.data
    if (!list || list.length === 0) return 0
    const preferredIndex = list.findIndex(item => item.isPreferred === true)
    return preferredIndex >= 0 ? preferredIndex : 0
  },
  getData(showLoading) {
    // hasToast: true 表示不显示 loading，false 表示显示 loading
    const hasToast = !showLoading
    api.request(this, '/question/v2/detail', {
      setType: 1,
      ...this.data.queryParam
    }, hasToast, 'GET', false)  // autoSetData = false，手动处理数据
      .then(res => {
        // 保存原始列表用于筛选
        if (res.list) {
          this.setData({ rawList: res.list })
        }
        // 使用 diff 更新，只更新变化的字段
        diffSetData(this, res)
        // 根据当前筛选值过滤数据
        this.filterAndSetList()

        // 自动定位到置顶版本
        const preferredIndex = this.findPreferredVersionIndex()
        if (preferredIndex !== this.data.versionIndex) {
          this.setData({ versionIndex: preferredIndex })
        }

        this.markLoaded()
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
