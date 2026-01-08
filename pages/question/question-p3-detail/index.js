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
    scoreFilter: '6.5',         // 当前筛选值，默认6.5版
    scoreFilterText: '6.5+版本', // 按钮显示文字
    scoreFilterDisabled: false, // 筛选按钮是否禁用（仅有通用版本时禁用）
    scoreFilterList: [],        // 从接口动态获取的难度列表
    availableDifficulties: [],  // 当前数据中可用的difficulty值（非general）
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
  // 分数筛选按钮点击
  onScoreFilterTap() {
    // 禁用状态下不响应点击
    if (this.data.scoreFilterDisabled) return

    const _this = this
    const { scoreFilterList, availableDifficulties } = this.data
    if (!scoreFilterList || scoreFilterList.length === 0) {
      api.toast('加载中，请稍后再试')
      return
    }
    // 排除 general 选项，构建菜单列表
    const selectableList = scoreFilterList.filter(item => item.value !== 'general')
    // 标记每个选项是否可用，不可用的显示"（待更新）"
    const itemList = selectableList.map(item => {
      const isAvailable = availableDifficulties.includes(String(item.value))
      return isAvailable ? item.text : item.text + '（待更新）'
    })
    wx.showActionSheet({
      itemList,
      success(res) {
        const selected = selectableList[res.tapIndex]
        const isAvailable = availableDifficulties.includes(String(selected.value))
        // 如果选择的版本不可用，不执行切换
        if (!isAvailable) {
          api.toast('该版本暂未更新')
          return
        }
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
  // 根据 scoreFilter 过滤答案列表（P3是三层结构，difficulty在句子层）
  filterAndSetList() {
    const { rawList, scoreFilter } = this.data
    if (!rawList || rawList.length === 0) return

    // P3的difficulty在句子层（list[].list[].list[]）
    // 筛选逻辑：对每个分组内的句子进行筛选
    const filteredList = rawList.map(version => {
      if (!version.list || version.list.length === 0) return version

      // 对每个分组，筛选其中的句子
      const filteredGroups = version.list.map(group => {
        if (!group.list || group.list.length === 0) return group

        // 过滤句子：保留匹配版本 + 通用版本 + 无difficulty字段的句子
        const filteredSentences = group.list.filter(sentence => {
          if (sentence.difficulty === undefined || sentence.difficulty === null) return true
          const difficulty = String(sentence.difficulty)
          if (difficulty === 'general') return true
          return difficulty === scoreFilter
        })

        return { ...group, list: filteredSentences }
      }).filter(group => group.list && group.list.length > 0) // 移除空分组

      return { ...version, list: filteredGroups }
    }).filter(version => version.list && version.list.length > 0) // 移除空版本

    // 保持 versionIndex 不变，只更新 list
    this.setData({ list: filteredList })
  },
  // 检测是否只有通用版本数据（禁用筛选按钮）- P3在句子层检查
  // 同时收集数据中可用的difficulty值
  checkScoreFilterDisabled() {
    const { rawList } = this.data
    if (!rawList || rawList.length === 0) return

    // P3的difficulty在句子层，收集所有句子
    const allSentences = []
    rawList.forEach(version => {
      if (version.list && version.list.length > 0) {
        version.list.forEach(group => {
          if (group.list && group.list.length > 0) {
            allSentences.push(...group.list)
          }
        })
      }
    })

    if (allSentences.length === 0) return

    // 收集数据中可用的difficulty值（非general、非空）
    const availableSet = new Set()
    allSentences.forEach(sentence => {
      if (sentence.difficulty !== undefined && sentence.difficulty !== null) {
        const diff = String(sentence.difficulty)
        if (diff !== 'general') {
          availableSet.add(diff)
        }
      }
    })
    const availableDifficulties = Array.from(availableSet)
    this.setData({ availableDifficulties })

    // 检查是否所有句子都是 general 或无 difficulty 字段
    const onlyGeneralOrNone = availableDifficulties.length === 0
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
  // 逻辑：如果用户选择的版本不存在，自动降级到其他可用版本
  validateAndFilter() {
    const { rawList, scoreFilter, scoreFilterList, availableDifficulties } = this.data
    if (!rawList || rawList.length === 0) return

    // 如果没有可用的非general版本，直接显示所有数据
    if (!availableDifficulties || availableDifficulties.length === 0) {
      this.filterAndSetList()
      return
    }

    // 检查当前 scoreFilter 是否在可用版本中
    const isCurrentAvailable = availableDifficulties.includes(scoreFilter)

    if (!isCurrentAvailable) {
      // 当前选择的版本不可用，降级到其他可用版本
      const fallbackFilter = availableDifficulties[0]
      let fallbackText = fallbackFilter + '+版本'
      if (scoreFilterList && scoreFilterList.length > 0) {
        const matched = scoreFilterList.find(item => String(item.value) === fallbackFilter)
        if (matched) {
          fallbackText = matched.text
        }
      }
      this.setData({
        scoreFilter: fallbackFilter,
        scoreFilterText: fallbackText
      })
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
