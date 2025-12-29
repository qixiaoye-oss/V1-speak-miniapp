const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    version: '1.0.2',
    accent: 'british', // 'british' 或 'american'
    accentText: '英音',
  },
  onShow() {
    this.startLoading()
    this.getUserInfo()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    const miniProgram = wx.getAccountInfoSync();
    this.setData({
      version: miniProgram.miniProgram.version,
    })
  },
  onLoad() { },
  onShareAppMessage: function () {
    return api.share('用户中心', this)
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
        const accent = res.tapIndex === 0 ? 'british' : 'american'
        const accentText = res.tapIndex === 0 ? '英音' : '美音'
        _this.setData({
          accent,
          accentText
        })
        // TODO: 调用后端 API 保存用户的口音偏好
      }
    })
  },
  // 获取用户信息
  getUserInfo() {
    const _this = this
    api.request(this, '/user/v1/user/info', {}, true).then(() => {
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.finishProgress(_this)
    })
  },
})
