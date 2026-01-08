const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    seriesIndex: 0,
    showMode: 'full'
  },
  // ===========生命周期 Start===========
  onLoad(options) { },
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
      this.listSeriesData(true)
    } else {
      // 从子页面返回：静默刷新
      this.listSeriesData(false)
    }
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listSeriesData(true)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toUnit(e) {
    const _this = this
    const { item } = e.currentTarget.dataset
    if (item.isInside == '0') {
      api.modal('', '暂未开通，请关注通知~', false)
      return
    }
    wx.showActionSheet({
      itemList: ['P2', 'P3'],
      success(res) {
        switch (res.tapIndex) {
          case 0:
            _this.hasP2Answer(item.id)
            break;
          case 1:
            _this.toP3List(item)
            break;
        }
      }
    })
  },
  changeLabel(e) {
    this.setData({
      seriesIndex: e.currentTarget.dataset.index
    })
    this.listData(false)
  },
  onModeChange(e) {
    this.setData({
      showMode: e.detail.mode
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listSeriesData(showLoading) {
    const hasToast = !showLoading
    api.request(this, '/set/v3/series/list', {
      albumId: this.options.id
    }, hasToast, 'GET', false)
      .then(res => {
        diffSetData(this, res)
        this.listData(showLoading)
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  listData(showLoading) {
    const { seriesList, seriesIndex } = this.data
    let param = {
      albumId: this.options.id,
      albumType: 2
    }
    if (seriesList && seriesList.length > 0) {
      param['seriesId'] = seriesList[seriesIndex].id
    }
    const hasToast = !showLoading
    api.request(this, '/set/v3/list', param, hasToast, 'GET', false)
      .then((res) => {
        diffSetData(this, res)
        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  },
  // 验证P2是否有答案内容
  hasP2Answer(setId) {
    api.request(this, '/question/v2/p2/hasAnswer', { setId }, false).then(res => {
      if (res) {
        this.navigateTo(`/pages/question/question-p2-detail/index?setId=${setId}`)
      } else {
        api.modal('', "即将更新（暂无内容）", false)
      }
    })
  },
  // 跳转P3列表（通过p3Total判断是否有内容）
  toP3List(item) {
    if (item.p3Total > 0) {
      this.navigateTo(`/pages/question/question-p3-list/index?setId=${item.id}`)
    } else {
      api.modal('', "即将更新（暂无内容）", false)
    }
  },
  // ===========数据获取 End===========
})
