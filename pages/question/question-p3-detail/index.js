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
    if (!rawList || rawList.length === 0) return

    // 过滤：保留匹配版本 + 通用版本 + 无difficulty字段的数据
    const filteredList = rawList.filter(item => {
      // 如果没有 difficulty 字段，视为通用版本，保留
      if (item.difficulty === undefined || item.difficulty === null) return true
      const difficulty = String(item.difficulty)
      if (difficulty === 'general') return true
      return difficulty === scoreFilter
    })

    // 保持 versionIndex 不变，只更新 list
    this.setData({ list: filteredList })
  },
  // 检测是否只有通用版本数据（禁用筛选按钮）
  checkScoreFilterDisabled() {
    const { rawList } = this.data
    if (!rawList || rawList.length === 0) return

    // 检查是否所有数据都是 general 或无 difficulty 字段
    const onlyGeneralOrNone = rawList.every(item => {
      if (item.difficulty === undefined || item.difficulty === null) return true
      return String(item.difficulty) === 'general'
    })
    if (onlyGeneralOrNone) {
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
  // 校验 scoreFilter 是否有效，无效则修正，然后过滤数据
  validateAndFilter() {
    const { rawList, scoreFilter, scoreFilterList } = this.data
    if (!rawList || rawList.length === 0) return

    // 检查数据中是否有 difficulty 字段
    const hasAnyDifficulty = rawList.some(item => item.difficulty !== undefined && item.difficulty !== null)

    // 如果数据中都没有 difficulty 字段，直接显示所有数据
    if (!hasAnyDifficulty) {
      this.filterAndSetList()
      return
    }

    // 检查当前 scoreFilter 是否在数据中存在
    const hasExactMatch = rawList.some(item => {
      if (item.difficulty === undefined || item.difficulty === null) return false
      return String(item.difficulty) === scoreFilter
    })

    // 如果没有精确匹配，尝试使用数据中第一个有效的 difficulty
    if (!hasExactMatch) {
      const firstWithDifficulty = rawList.find(item => {
        if (item.difficulty === undefined || item.difficulty === null) return false
        return String(item.difficulty) !== 'general'
      })
      if (firstWithDifficulty) {
        const newFilter = String(firstWithDifficulty.difficulty)
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
    this.filterAndSetList()
  },
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
