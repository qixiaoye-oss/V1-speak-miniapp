const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    version: '1.0.2',
    accent: 'uk', // 'uk' 或 'us'
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
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.finishProgress(_this)
    })
  },
})
