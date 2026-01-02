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

    // 获取小程序版本信息
    const accountInfo = wx.getAccountInfoSync()
    const version = accountInfo.miniProgram.version
    if (version) {
      this.setData({ version })
    }
  },
  onLoad() { },
  onShareAppMessage: function () {
    return api.share('考雅口语Open题库', this)
  },
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
  // 获取用户信息
  getUserInfo() {
    const _this = this
    api.request(this, '/user/v1/user/info', {}, true).then((data) => {
      // 从返回数据中读取口音偏好
      const pronunciation = data.user?.pronunciation || 'uk'
      _this.setData({
        accent: pronunciation,
        accentText: pronunciation === 'us' ? '美音' : '英音'
      })
      _this.markLoaded()
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.finishProgress(_this)
    })
  },
})
