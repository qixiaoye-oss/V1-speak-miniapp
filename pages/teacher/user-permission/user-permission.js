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
  labelChange(e) {
    let index = e.currentTarget.dataset.index
    let path1 = `permissionsList[` + index + `].resource`
    let path2 = `permissionsList[` + index + `].dictIndex`
    this.setData({
      [path1]: this.data.sheetList[e.detail.value].value,
      [path2]: e.detail.value
    })
  },
  effectiveDateChange(e) {
    let index = e.currentTarget.dataset.index
    let path = `permissionsList[` + index + `].effectiveDate`
    this.setData({
      [path]: e.detail.value,
    })
  },
  expiryDateChange(e) {
    let index = e.currentTarget.dataset.index
    let path = `permissionsList[` + index + `].expiryDate`
    this.setData({
      [path]: e.detail.value,
    })
  },
  addList() {
    let list = this.data.permissionsList
    list.push({
      resource: '',
      effectiveDate: '',
      expiryDate: '',
      dictIndex: -1
    })
    this.setData({
      permissionsList: list
    })
  },
  submit: function (e) {
    let that = this
    let list = []
    this.data.permissionsList.forEach(item => {
      list.push({
        ...item,
        userId: that.data.userId
      })
    })
    api.request(this, '/user/saveUserPermissions', list, true, "POST").then(res => {
      api.toast("保存成功")
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listDict() {
    api.request(this, '/sys/albumLabel', {}, true).finally(() => { this.finishLoading() })
  },
  listUser() {
    api.request(this, '/user/listUserByName', {
      nameOrId: this.data.inputVal
    }, true)
  },
  listUserRole(userId) {
    let that = this
    api.request(this, '/user/listUserPermissions', {
      userId: userId
    }, true).then(res => {
      let list = res.permissionsList
      if (list.length == 0) {
        list.push({
          resource: '',
          effectiveDate: '',
          expiryDate: '',
          dictIndex: -1
        })
      } else {
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          that.data.sheetList.forEach((dict, index) => {
            if (dict.value == p.resource) {
              p['dictIndex'] = index
            }
          });
        }
      }
      that.setData({
        permissionsList: list
      })
    })
  },
  // ===========数据获取 End===========
})