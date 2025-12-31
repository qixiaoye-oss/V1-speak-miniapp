const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    usefulCount: 0,
    shaking: false
  },
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.listData()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 有用
  useful() {
    const isFirstClick = this.data.usefulCount === 0

    // 第一次点击时设置为1，之后保持不变
    if (isFirstClick) {
      this.setData({ usefulCount: 1 })
      this.lable('useful')
    }

    // 每次点击都触发 shake 动画
    // 等 hover 效果结束后再触发 shake 动画
    setTimeout(() => {
      this.setData({ shaking: true })
      // 动画结束后移除 shake 类
      setTimeout(() => {
        this.setData({ shaking: false })
      }, 600)
    }, 150)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listData() {
    const _this = this
    api.request(this, `/popular/science/v1/detail/${this.options.id}`, {}, true).then(() => {
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(_this)
    })
  },
  lable(type) {
    api.request(this, `/popular/science/v1/label/${type}/${this.options.id}`, {}, true).catch(() => {
      // 点赞失败仅提示，已在 api.js 中 toast
    })
  },
  // ===========数据获取 End===========
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  }
})
