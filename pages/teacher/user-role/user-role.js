const pageLoading = require('../../../behaviors/pageLoading')
const api = getApp().api
let timer
Page({
  behaviors: [pageLoading],
  data: {
    inputShowed: true
  },
  // ===========生命周期 Start===========
  onLoad() {
    this.startLoading()
    this.listDict()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  bindinput(e) {
    this.setData({
      inputVal: e.detail.value,
      inputShowed: true
    })
    clearTimeout(timer)
    timer = setTimeout(() => {
      this.listUser()
    }, 1000)
  },
  selectResult(e) {
    this.setData({
      inputShowed: false,
      userId: e.detail.id,
      userName: e.detail.nickName
    })
    // 查询已经关联的角色
    this.listUserRole(e.detail.id)
  },
  hide() {
    this.setData({
      inputShowed: true
    })
  },
  listUserRole(userId) {
    api.request(this, '/user/listUserRole', {
      userId: userId
    }, true)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listDict() {
    api.request(this, '/sys/albumLabel', {}, true).finally(() => { this.finishLoading() })
  },
  listUser() {
    api.request(this, '/user/listUserByName', {
      nameOrId: this.data.inputVal
    }, true).then(res => {
      console.log(res);
    })
  },
  submit: function (e) {
    let param = {
      roleUser: e.detail.value.roleResource.join(','),
      userId: e.detail.value.userId
    }
    api.request(this, '/user/saveUserRole', param, true, "POST").then(res => {
      api.toast("保存成功")
    })
  },
  // ===========数据获取 End===========
})