const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const smartLoading = require('../../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight, smartLoading],
  data: {
    usefulCount: 0,
    shaking: false
  },
  // ===========生命周期 Start===========
  onLoad(options) {
    // 保存参数，提前发起请求（页面动画期间就开始请求）
    this._id = options.id
    this.startLoading()
    this.listData()
  },
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
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
    this.registerTimer('shakeStart', () => {
      this.setData({ shaking: true })
      // 动画结束后移除 shake 类
      this.registerTimer('shakeEnd', () => {
        this.setData({ shaking: false })
      }, 600)
    }, 150)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listData() {
    api.request(this, `/popular/science/v1/detail/${this._id}`, {}, false, 'GET', false)
      .then((res) => {
        this.setData(res)
        this.markLoaded()
        this.finishLoading()
        this.setDataReady()
        // 延迟计算，确保按钮组渲染完成
        wx.nextTick(() => {
          this.updateButtonGroupHeight()
        })
      })
      .catch(() => {
        this.finishLoading()
        pageGuard.goBack(this)
      })
  },
  lable(type) {
    api.request(this, `/popular/science/v1/label/${type}/${this._id}`, {}, true).catch(() => {
      // 点赞失败仅提示，已在 api.js 中 toast
    })
  },
  // ===========数据获取 End===========
})
