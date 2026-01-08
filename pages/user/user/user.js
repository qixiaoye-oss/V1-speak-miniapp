const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const smartLoading = require('../../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, smartLoading],
  data: {
    version: '1.0.0',
    accent: 'uk', // 'uk' 或 'us'
    accentText: '英音',
    difficulty: '6', // 默认6分版
    difficultyText: '6分版',
    difficultyList: [], // 从接口获取的难度列表
  },
  onShow() {
    // tabBar 选中状态需要每次更新
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }

    // 只在首次加载时请求数据（用户信息不需要频繁刷新）
    const isFirstLoad = !this.data._hasLoaded
    if (!isFirstLoad) {
      return
    }

    this.startLoading()
    this.getUserInfo()
    this.getDifficultyList()

    // 获取小程序版本信息
    const accountInfo = wx.getAccountInfoSync()
    const version = accountInfo.miniProgram.version
    if (version) {
      this.setData({ version })
    }
  },
  onLoad() { },
  // ==============功能点
  // 修改用户信息
  toUpdateUserInfo() {
    this.navigateTo('/pages/user/login/login')
  },
  // 显示英音美音选择器
  showAccentPicker() {
    const _this = this
    wx.showActionSheet({
      itemList: ['英音', '美音'],
      success(res) {
        const accent = res.tapIndex === 0 ? 'uk' : 'us'
        const accentText = res.tapIndex === 0 ? '英音' : '美音'
        // 调用 API 保存用户的口音偏好
        api.request(_this, '/user/v1/user/update', {
          pronunciation: accent
        }, true, 'POST').then(() => {
          _this.setData({
            accent,
            accentText
          })
        })
      }
    })
  },
  // 显示答案难度选择器
  showDifficultyPicker() {
    const _this = this
    const { difficultyList } = this.data
    if (!difficultyList || difficultyList.length === 0) {
      api.toast('加载中，请稍后再试')
      return
    }
    // 生成选项列表（排除"通用"选项，用户不需要选择通用）
    const selectableList = difficultyList.filter(item => item.value !== 'general')
    const itemList = selectableList.map(item => item.text)
    wx.showActionSheet({
      itemList,
      success(res) {
        const selected = selectableList[res.tapIndex]
        // 调用 API 保存用户的难度偏好
        api.request(_this, '/user/v1/user/update', {
          difficultySpeak: selected.value
        }, true, 'POST').then(() => {
          _this.setData({
            difficulty: selected.value,
            difficultyText: selected.text
          })
          // 同步到本地缓存
          wx.setStorageSync('difficultySpeak', selected.value)
        })
      }
    })
  },
  // 获取难度列表
  getDifficultyList() {
    const _this = this
    api.request(this, '/system/list/dict/classify_scores', {}, true).then(res => {
      if (res && res.dictItems) {
        _this.setData({ difficultyList: res.dictItems })
        // 根据当前难度值更新显示文字
        const { difficulty } = _this.data
        const current = res.dictItems.find(item => String(item.value) === String(difficulty))
        if (current) {
          _this.setData({ difficultyText: current.text })
        } else {
          // 当前难度值不在列表中，使用第一个非 general 选项
          const firstValid = res.dictItems.find(item => item.value !== 'general')
          if (firstValid) {
            _this.setData({
              difficulty: String(firstValid.value),
              difficultyText: firstValid.text
            })
            wx.setStorageSync('difficultySpeak', firstValid.value)
          }
        }
      }
    })
  },
  // 获取用户信息
  getUserInfo() {
    const _this = this
    api.request(this, '/user/v1/user/info', {}, true).then((data) => {
      // 从返回数据中读取口音偏好
      const pronunciation = data.user?.pronunciation || 'uk'
      // 从返回数据中读取难度偏好
      const difficultySpeak = data.user?.difficultySpeak || '6'
      // 根据 difficultyList 获取显示文本（如果已加载）
      const { difficultyList } = _this.data
      let difficultyText = _this.data.difficultyText
      if (difficultyList && difficultyList.length > 0) {
        const current = difficultyList.find(item => String(item.value) === String(difficultySpeak))
        if (current) {
          difficultyText = current.text
        }
      }
      _this.setData({
        accent: pronunciation,
        accentText: pronunciation === 'us' ? '美音' : '英音',
        difficulty: difficultySpeak,
        difficultyText
      })
      // 同步到本地缓存
      wx.setStorageSync('difficultySpeak', difficultySpeak)
      _this.markLoaded()
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.finishProgress(_this)
    })
  },
})
