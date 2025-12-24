const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
Page({
  behaviors: [pageLoading],
  data: {},
  onShow() {
    this.startLoading()
    this.getUser(this)
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    const systemInfo = wx.getSystemInfoSync();
    const tabBarHeight = systemInfo.windowHeight - systemInfo.statusBarHeight;
    const miniProgram = wx.getAccountInfoSync();
    this.setData({
      version: miniProgram.miniProgram.version,
      bottom: tabBarHeight - 90
    })
  },
  onLoad() { },
  onShareAppMessage: function () {
    return api.share('用户中心', this)
  },
  // ==============功能点
  // 修改用户信息
  toUpdateUserInfo() {
    wx.navigateTo({
      url: '/pages/user/login/login',
    })
  },
  // 查看权限有效期
  showRole() {
    this.setData({
      showPopup: true
    })
  },
  // 修改音频发音方式
  showAudioType() {
    const _this = this
    wx.showActionSheet({
      itemList: ["英式发音", "美式发音"],
      success(res) {
        _this.updateAudioType(res.tapIndex == 0 ? "uk" : "us")
      },
    })
  },
  // 用户权限管理
  toUpdateAuth() {
    wx.navigateTo({
      url: '/pages/teacher/widget/widget',
    })
  },
  // 切换用户
  checkUser() {
    const _this = this
    wx.showModal({
      title: '切换用户',
      editable: true,
      placeholderText: '请输入用户ID',
      complete: (res) => {
        if (res.confirm && res.content) {
          _this.listUser(res.content)
        }
      }
    })
  },
  getUser() {
    api.request(this, '/user/v1/user/info', {}, true).then(res => { }).finally(() => {
      this.finishLoading()
    })
  },
  // 接口调用-修改发音
  updateAudioType(type) {
    api.request(this, '/user/saveUserPronunciationType', {
      pronunciation: type
    }, false, "post").then(res => {
      wx.setStorageSync('user', res.user)
    })
  },
  // 接口调用-获取用户信息
  listUser(no) {
    api.request(this, '/user/listUserByName', {
      nameOrId: no
    }, true).then(res => {
      let list = res.userList || []
      if (list.length != 1) {
        api.toast("切换失败，用户ID不正确")
      } else {
        let user = wx.getStorageSync('user')
        user.id = list[0].id
        wx.setStorageSync('user', user)
        api.toast("切换成功")
      }
    })
  },
})
