const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    version: '1.0.2',
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
  // 用户权限管理
  toUpdateAuth() {
    this.navigateTo('/pages/teacher/widget/widget')
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
