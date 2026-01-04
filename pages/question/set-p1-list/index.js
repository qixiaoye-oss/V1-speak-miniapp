const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    showMode: "full"
  },
  // ===========生命周期 Start===========
  onShow() {
    const isFirstLoad = !this.data._hasLoaded

    // 从后台返回，不刷新
    if (!isFirstLoad && this.isFromBackground()) {
      return
    }

    // 首次加载：显示 loading
    if (isFirstLoad) {
      this.startLoading()
      this.hideLoadError()
      this.listData(true)
    } else {
      // 从子页面返回：静默刷新（diff 更新）
      this.listData(false)
    }
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listData(true)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toUnit(e) {
    const { item } = e.currentTarget.dataset
    if (item.isInside == '0') {
      api.modal('', '暂未开通，请关注通知~', false)
      return
    }
    this.navigateTo(`/pages/question/question-p1-list/index?setId=${item.id}&hasMastered=${item.hasMastered}`)
  },
  onModeChange(e) {
    this.setData({
      showMode: e.detail.mode
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(showLoading) {
    // hasToast: true 表示不显示 loading，false 表示显示 loading
    const hasToast = !showLoading
    api.request(this, '/set/v2/list', {
      albumId: this.options.id,
      albumType: 1,
    }, hasToast, 'GET', false)  // autoSetData = false，手动处理数据
      .then((res) => {
        // 使用 diff 更新，只更新变化的字段
        diffSetData(this, res)
        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // ===========数据获取 End===========
})
