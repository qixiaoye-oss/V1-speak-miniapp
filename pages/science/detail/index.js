const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight, smartLoading],
  data: {
    usefulCount: 0,
    shaking: false
  },
  // ===========生命周期 Start===========
  onShow() {
    const isFirstLoad = !this.data._hasLoaded

    // 科普详情页：只在首次加载时请求数据，后续不刷新
    if (!isFirstLoad) {
      return
    }

    // 首次加载：显示 loading
    this.startLoading()
    this.listData(true)
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
  listData(showLoading) {
    const hasToast = !showLoading
    api.request(this, `/popular/science/v1/detail/${this.options.id}`, {}, hasToast, 'GET', false)
      .then((res) => {
        diffSetData(this, res)
        this.markLoaded()
        this.finishLoading()  // 先隐藏骨架屏
        this.setDataReady()   // 再显示内容
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
    api.request(this, `/popular/science/v1/label/${type}/${this.options.id}`, {}, true).catch(() => {
      // 点赞失败仅提示，已在 api.js 中 toast
    })
  },
  // ===========数据获取 End===========
})
