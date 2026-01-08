/**
 * 版本筛选 Behavior
 * 用于 P1/P2/P3 详情页的 6.5/7.5 版本筛选功能
 *
 * 使用方法：
 * 1. 在页面中引入: const scoreFilter = require('../../behaviors/scoreFilter')
 * 2. 添加到 behaviors: behaviors: [scoreFilter]
 * 3. 在 onLoad 中初始化筛选值并获取难度列表:
 *    const difficultySpeak = wx.getStorageSync('difficultySpeak') || '6.5'
 *    this.setData({ scoreFilter: String(difficultySpeak) })
 *    this.getDifficultyList()
 * 4. 在 getData 成功后调用:
 *    this.setData({ rawList: res.list })
 *    this.checkScoreFilterDisabled()
 *    this.validateAndFilter()
 *
 * 数据结构要求：
 * - 三层嵌套结构：list[] → list[].list[] → list[].list[].list[]
 * - difficulty 字段在最内层（句子层）
 * - difficulty 值：'6.5' / '7.5' / 'general' / undefined
 */

const api = getApp().api

module.exports = Behavior({
  data: {
    scoreFilter: '6.5',          // 当前筛选值，默认6.5版
    scoreFilterText: '6.5+版本', // 按钮显示文字
    scoreFilterDisabled: false,  // 筛选按钮是否禁用（仅有通用版本时禁用）
    scoreFilterList: [],         // 从接口动态获取的难度列表
    availableDifficulties: [],   // 当前数据中可用的difficulty值（非general）
    rawList: [],                 // 原始答案列表（未筛选）
  },

  methods: {
    /**
     * 分数筛选按钮点击
     * 弹出版本选择菜单，不可用版本显示"（待更新）"
     */
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
          // 切换前打断音频
          if (typeof _this.interruptAudio === 'function') {
            _this.interruptAudio()
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

    /**
     * 根据 scoreFilter 过滤答案列表
     * 三层嵌套结构：list[] → list[].list[] → list[].list[].list[]
     * difficulty 在句子层（第三层）
     */
    filterAndSetList() {
      const { rawList, scoreFilter, list: currentList } = this.data
      if (!rawList || rawList.length === 0) return

      // 1. 保存当前置顶状态（通过 id 映射）
      const preferredMap = {}
      if (currentList && currentList.length > 0) {
        currentList.forEach(item => {
          if (item.id) {
            preferredMap[item.id] = item.isPreferred
          }
        })
      }

      // 2. 筛选逻辑：对每个版本内的分组内的句子进行筛选
      const filteredList = rawList.map(version => {
        if (!version.list || version.list.length === 0) return { ...version }

        // 对每个分组，筛选其中的句子
        const filteredGroups = version.list.map(group => {
          if (!group.list || group.list.length === 0) return { ...group }

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

      // 3. 恢复置顶状态
      filteredList.forEach(item => {
        if (item.id && preferredMap[item.id] !== undefined) {
          item.isPreferred = preferredMap[item.id]
        }
      })

      // 保持 versionIndex 不变，只更新 list
      this.setData({ list: filteredList })
    },

    /**
     * 同步置顶状态到 rawList
     * 在 onTopSwitch 修改置顶后调用，确保 rawList 与 list 的置顶状态一致
     */
    syncPreferredToRawList() {
      const { list, rawList } = this.data
      if (!list || !rawList || list.length === 0 || rawList.length === 0) return

      // 构建 id -> isPreferred 映射
      const preferredMap = {}
      list.forEach(item => {
        if (item.id) {
          preferredMap[item.id] = item.isPreferred
        }
      })

      // 更新 rawList 中的置顶状态
      let hasChanges = false
      rawList.forEach(item => {
        if (item.id && item.id in preferredMap) {
          if (item.isPreferred !== preferredMap[item.id]) {
            item.isPreferred = preferredMap[item.id]
            hasChanges = true
          }
        }
      })

      // 只有有变化时才更新
      if (hasChanges) {
        this.setData({ rawList })
      }
    },

    /**
     * 检测数据中可用的版本，并决定是否禁用筛选按钮
     * 同时收集数据中可用的difficulty值（非general）
     */
    checkScoreFilterDisabled() {
      const { rawList } = this.data
      if (!rawList || rawList.length === 0) return

      // 收集所有句子（三层嵌套）
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

    /**
     * 校验 scoreFilter 是否有效，无效则自动降级到可用版本
     * 然后执行过滤
     */
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

    /**
     * 获取难度列表（从接口）
     * 并根据当前筛选值设置按钮文字
     */
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
    }
  }
})
