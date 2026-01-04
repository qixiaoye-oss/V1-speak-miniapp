const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {},
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
      // 从子页面返回：静默刷新（打卡后 tag 需要更新）
      this.listData(false)
    }
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listData(true)
  },
  onUnload() {
    wx.removeStorageSync('questionIdArr')
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toChildPage({ currentTarget: { dataset: { id, childTotal } } }) {
    if (childTotal == 0) {
      api.modal('', "本题暂无答案", false)
      return
    }
    let param = {
      setId: this.options.setId,
      id: id
    }
    this.navigateTo('/pages/question/question-p3-detail/index' + api.parseParams(param))
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(showLoading) {
    const hasToast = !showLoading
    api.request(this, '/question/v2/p3/list', {
      setType: 3,
      ...this.options
    }, hasToast, 'GET', false)
      .then(res => {
        diffSetData(this, res)

        // 保存题目 ID 列表
        let idArr = []
        res.list.forEach(i => {
          idArr.push(i.id)
        })
        wx.setStorageSync('questionIdArr', idArr)

        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  }
  // ===========数据获取 End===========
})
