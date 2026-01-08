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
    showPopup: false,
    seriesIndex: 0,
    versionIndex: 0,
    scoreFilter: '6',           // 当前筛选值，默认6分版
    scoreFilterText: '6分版',   // 按钮显示文字
    scoreFilterDisabled: false, // 筛选按钮是否禁用（仅有通用版本时禁用）
    scoreFilterList: [],        // 从接口动态获取的难度列表
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
      // 从子页面（录音页）返回：静默刷新
      this.getData(false)
    }
  },
  onLoad(options) {
    // 读取用户默认难度设置
    const difficultySpeak = wx.getStorageSync('difficultySpeak') || '6'
    this.setData({
      queryParam: options,
      scoreFilter: String(difficultySpeak)
    })
    this.initSentenceAudio()
    this.getDifficultyList()
  },
  onUnload() {
    wx.removeStorageSync('questionIdArr')
    this.destroySentenceAudio()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 分数筛选按钮点击
  onScoreFilterTap() {
    // 禁用状态下不响应点击
    if (this.data.scoreFilterDisabled) return

    const _this = this
    const { scoreFilterList } = this.data
    if (!scoreFilterList || scoreFilterList.length === 0) {
      api.toast('加载中，请稍后再试')
      return
    }
    // 排除 general 选项
    const selectableList = scoreFilterList.filter(item => item.value !== 'general')
    const itemList = selectableList.map(item => item.text)
    wx.showActionSheet({
      itemList,
      success(res) {
        const selected = selectableList[res.tapIndex]
        _this.setData({
          scoreFilter: String(selected.value),
          scoreFilterText: selected.text
        })
        // 根据新筛选值重新过滤数据
        _this.filterAndSetList()
        // 滚动到页面顶部
        wx.pageScrollTo({ scrollTop: 0, duration: 300 })
      }
    })
  },
  // 根据 scoreFilter 过滤答案列表
  filterAndSetList() {
    const { rawList, scoreFilter } = this.data
    console.log('[P2] filterAndSetList 开始')
    console.log('[P2] rawList.length:', rawList?.length)
    console.log('[P2] scoreFilter:', scoreFilter)

    if (!rawList || rawList.length === 0) {
      console.log('[P2] rawList 为空，退出')
      return
    }

    // 过滤：保留匹配版本 + 通用版本（使用 String 确保类型一致）
    const filteredList = rawList.filter(item => {
      const difficulty = String(item.difficulty)
      if (difficulty === 'general') return true
      return difficulty === scoreFilter
    })

    console.log('[P2] 过滤后 filteredList.length:', filteredList.length)
    console.log('[P2] filteredList 各项 difficulty:', filteredList.map(item => item.difficulty))

    // 保持 versionIndex 不变，只更新 list
    this.setData({ list: filteredList })
  },
  // 检测是否只有通用版本数据（禁用筛选按钮）
  checkScoreFilterDisabled() {
    const { rawList } = this.data
    if (!rawList || rawList.length === 0) return

    // 检查是否所有数据都是 general（使用 String 确保类型一致）
    const onlyGeneral = rawList.every(item => String(item.difficulty) === 'general')
    if (onlyGeneral) {
      this.setData({
        scoreFilterDisabled: true,
        scoreFilterText: '通用版本'
      })
    } else {
      this.setData({
        scoreFilterDisabled: false
      })
    }
  },
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
  // 获取难度列表
  getDifficultyList() {
    const _this = this
    api.request(this, '/system/list/dict/classify_scores', {}, true).then(res => {
      if (res && res.dictItems) {
        _this.setData({ scoreFilterList: res.dictItems })
        // 根据当前筛选值设置按钮文字
        const { scoreFilter } = _this.data
        const current = res.dictItems.find(item => String(item.value) === scoreFilter)
        if (current) {
          _this.setData({ scoreFilterText: current.text })
        } else {
          // 当前筛选值不在列表中，使用第一个非 general 选项
          const firstValid = res.dictItems.find(item => item.value !== 'general')
          if (firstValid) {
            _this.setData({
              scoreFilter: String(firstValid.value),
              scoreFilterText: firstValid.text
            })
            // 如果数据已加载，重新过滤
            if (_this.data.rawList && _this.data.rawList.length > 0) {
              _this.filterAndSetList()
            }
          }
        }
      }
    })
  },
  // 查找置顶版本的索引
  findPreferredVersionIndex() {
    const { list } = this.data
    if (!list || list.length === 0) return 0
    const preferredIndex = list.findIndex(item => item.isPreferred === true)
    return preferredIndex >= 0 ? preferredIndex : 0
  },
  getData(showLoading) {
    const hasToast = !showLoading
    api.request(this, '/question/v3/detail', {
      setType: 2,
      ...this.data.queryParam
    }, hasToast, 'GET', false)
      .then((res) => {
        diffSetData(this, res)

        // 自动定位到置顶版本
        const preferredIndex = this.findPreferredVersionIndex()
        if (preferredIndex !== this.data.versionIndex) {
          this.setData({ versionIndex: preferredIndex })
        }

        this.getStoryData(!showLoading)
        this.markLoaded()
        this.setDataReady()
        this.updateButtonGroupHeight()
      })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => { this.finishLoading() })
  },
  getStoryData(silent) {
    const { detail, seriesList, seriesIndex } = this.data
    let param = {
      setId: this.options.setId,
      id: detail.id,
    }
    if (seriesList && seriesList.length > 0) {
      param['seriesId'] = seriesList[seriesIndex].id
    }
    const hasToast = silent ? true : false
    api.request(this, '/question/v3/detail/story', param, hasToast, 'GET', false)
      .then((res) => {
        console.log('[P2] getStoryData 返回:', res)
        console.log('[P2] res.list:', res.list)
        console.log('[P2] res.list 各项 difficulty:', res.list?.map(item => item.difficulty))
        // 保存原始列表用于筛选
        if (res.list) {
          this.setData({ rawList: res.list })
        }
        diffSetData(this, res)
        // 检测是否只有通用版本（决定是否禁用筛选按钮）
        this.checkScoreFilterDisabled()
        // 校验并修正 scoreFilter，然后过滤数据
        this.validateAndFilter()
      })
  },
  // 校验 scoreFilter 是否有效，无效则修正，然后过滤数据
  validateAndFilter() {
    const { rawList, scoreFilter, scoreFilterList } = this.data
    console.log('[P2] validateAndFilter 开始')
    console.log('[P2] rawList.length:', rawList?.length)
    console.log('[P2] 当前 scoreFilter:', scoreFilter)
    console.log('[P2] scoreFilterList:', scoreFilterList)

    if (!rawList || rawList.length === 0) {
      console.log('[P2] rawList 为空，退出')
      return
    }

    // 检查当前 scoreFilter 是否在数据中存在
    const hasMatchingData = rawList.some(item => {
      const difficulty = String(item.difficulty)
      return difficulty === scoreFilter || difficulty === 'general'
    })
    console.log('[P2] hasMatchingData:', hasMatchingData)

    // 检查是否有精确匹配 scoreFilter 的数据
    const hasExactMatch = rawList.some(item => String(item.difficulty) === scoreFilter)
    console.log('[P2] hasExactMatch (scoreFilter in data):', hasExactMatch)

    // 如果没有匹配的数据（除了 general），尝试使用第一个有效的 difficulty
    if (!hasMatchingData || !hasExactMatch) {
      // 从数据中找到第一个非 general 的 difficulty
      const firstNonGeneral = rawList.find(item => String(item.difficulty) !== 'general')
      console.log('[P2] firstNonGeneral:', firstNonGeneral)
      if (firstNonGeneral) {
        const newFilter = String(firstNonGeneral.difficulty)
        console.log('[P2] 修正 scoreFilter 为:', newFilter)
        // 从 scoreFilterList 中找到对应的文字
        let newText = newFilter + '+版本'
        if (scoreFilterList && scoreFilterList.length > 0) {
          const matched = scoreFilterList.find(item => String(item.value) === newFilter)
          if (matched) {
            newText = matched.text
          }
        }
        this.setData({
          scoreFilter: newFilter,
          scoreFilterText: newText
        })
      }
    }

    // 执行过滤
    console.log('[P2] 执行 filterAndSetList，当前 scoreFilter:', this.data.scoreFilter)
    this.filterAndSetList()
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
