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
    wx.removeStorageSync('questionIdArr')
    this.destroySentenceAudio()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 播放/停止指定 block 的所有句子
  onFooterPlay(e) {
    const { versionIndex, blockIndex } = e.currentTarget.dataset
    const { list } = this.data
    const block = list[versionIndex].list[blockIndex]

    if (e.detail.playing) {
      this._playBlockSentences(versionIndex, blockIndex, block)
    } else {
      this._stopBlockSentences(versionIndex, blockIndex)
    }
  },
  // 播放单个 block 的所有句子
  _playBlockSentences(versionIndex, blockIndex, block) {
    this.stopAudio()
    this.resetSentenceAudioStatus()
    this._resetAllBlockPlayingStatus()
    this._singlePlayState = null  // 清除单句播放状态

    // 获取该 block 的所有句子
    const sentences = []
    block.list.forEach((sentence, idx) => {
      if (sentence.audioUrl) {
        sentences.push({
          audioUrl: sentence.audioUrl,
          path: `list[${versionIndex}].list[${blockIndex}].list[${idx}].playStatus`
        })
      }
    })

    if (sentences.length === 0) return

    // 设置播放状态
    this._playAllState = {
      versionIndex,
      blockIndex,
      sentences,
      currentIndex: 0
    }

    this.setData({
      [`list[${versionIndex}].list[${blockIndex}].isPlaying`]: true
    })

    this._playSentenceByIndex(0)
  },
  // 停止 block 播放
  _stopBlockSentences(versionIndex, blockIndex) {
    this.stopAudio()
    this._playAllState = null
    this._singlePlayState = null  // 清除单句播放状态
    this.resetSentenceAudioStatus()
    this.setData({
      [`list[${versionIndex}].list[${blockIndex}].isPlaying`]: false
    })
  },
  // 重置所有 block 的播放状态
  _resetAllBlockPlayingStatus() {
    const { list } = this.data
    if (!list) return

    const updates = {}
    list.forEach((version, vIdx) => {
      if (version.list) {
        version.list.forEach((block, bIdx) => {
          if (block.isPlaying) {
            updates[`list[${vIdx}].list[${bIdx}].isPlaying`] = false
          }
        })
      }
    })

    if (Object.keys(updates).length > 0) {
      this.setData(updates)
    }
  },
  // 重写：单句播放（P2 的 isPlaying 在 block 级别）
  playSentence(e) {
    // 停止连续播放模式
    this._playAllState = null
    this._resetAllBlockPlayingStatus()

    const { list } = this.data
    const { answerIndex, sentenceIndex, groupIndex } = e.currentTarget.dataset

    const sentence = list[answerIndex].list[groupIndex].list[sentenceIndex]
    const path = `list[${answerIndex}].list[${groupIndex}].list[${sentenceIndex}].playStatus`
    const isPlayingPath = `list[${answerIndex}].list[${groupIndex}].isPlaying`

    // 检查是否点击了正在播放的同一句子（切换停止）
    if (this._singlePlayState &&
        this._singlePlayState.answerIndex === answerIndex &&
        this._singlePlayState.sentenceIndex === sentenceIndex &&
        this._singlePlayState.groupIndex === groupIndex) {
      // 停止播放
      this.stopAudio()
      this.resetSentenceAudioStatus()
      this._singlePlayState = null
      this.setData({
        [isPlayingPath]: false
      })
      return
    }

    if (sentence && sentence.audioUrl) {
      this.stopAudio()
      this.resetSentenceAudioStatus()

      // 记录单句播放状态
      this._singlePlayState = {
        answerIndex: answerIndex,
        sentenceIndex: sentenceIndex,
        groupIndex: groupIndex,
        path: path,
        isPlayingPath: isPlayingPath
      }

      this.playAudio(sentence.audioUrl)
      this.setData({
        [path]: 'playing',
        [isPlayingPath]: true  // P2 的 isPlaying 在 block 级别
      })
    }
  },
  // 重写：播放指定索引的句子（覆盖 behavior 方法）
  _playSentenceByIndex(index) {
    if (!this._playAllState) return

    const { sentences, versionIndex, blockIndex } = this._playAllState
    if (index >= sentences.length) {
      // 播放完毕
      this._playAllState = null
      this.setData({
        audioPlayer: false,
        [`list[${versionIndex}].list[${blockIndex}].isPlaying`]: false
      })
      this.resetSentenceAudioStatus()
      return
    }

    const sentence = sentences[index]
    this._playAllState.currentIndex = index

    // 重置所有句子状态，然后高亮当前句子
    this.resetSentenceAudioStatus()
    this.setData({
      [sentence.path]: 'playing'
    })

    // 播放音频
    this.playAudio(sentence.audioUrl)
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
  // 保存P2答案置顶状态
  updatePin(index) {
    const { detail, list } = this.data
    api.request(this, '/v2/question/p2/answer/preferred', {
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
    const _this = this
    api.request(this, '/question/v3/detail', {
      setType: 2,
      ...this.data.queryParam
    }, isPull)
      .then(() => {
        // 自动定位到置顶版本
        const preferredIndex = this.findPreferredVersionIndex()
        if (preferredIndex !== this.data.versionIndex) {
          this.setData({ versionIndex: preferredIndex })
        }
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
