const api = getApp().api
Page({
  data: {
    checked: false
  },
  onReady() {
    api.request(this, '/user/v1/user/info', {}, true).catch(() => {
      // 新用户可能无数据，静默失败
    })
  },
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail
    const _this = this
    api.uploadFileToOSS(avatarUrl, 'user/avatar/', this).then(res => {
      _this.setData({
        [`user.headUrl`]: res
      })
    })
  },
  formSubmit(e) {
    const {
      nickName,
      headUrl
    } = e.detail.value
    this.uploadHead(headUrl, nickName)
  },
  //上传头像
  uploadHead(headUrl, nickName) {
    if (api.isEmpty(headUrl)) {
      api.toast('请选择用户头像')
      return
    }
    if (api.isEmpty(nickName)) {
      api.toast('请填写用户昵称')
      return
    }
    const _this = this
    _this.updateUser(headUrl, nickName);
  },
  updateUser(headUrl, nickName) {
    api.request(this, '/user/v1/user/update', {
      nickName: nickName,
      avatarUrl: headUrl
    }, true, "POST").then(res => {
      this.navigateBack()
    }).catch(() => {
      // 保存失败仅提示，保留表单数据
    })
  }
})