const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')
const { diffSetData } = require('../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    hasMastered: false
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
  onLoad(options) {
    this.setData({ hasMastered: options.hasMastered === 'true' })
  },
  onUnload() {
    wx.removeStorageSync('questionIdArr')
  },
  onShareAppMessage() {
    return api.share('考雅口语Open题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  switchChange(e) {
    this.setData({
      hasMastered: e.detail.value
    })
    this.saveMastered()
  },
  toChildPage({ currentTarget: { dataset: { id, childTotal } } }) {
    if (childTotal == 0) {
      api.modal('', "本题暂无答案", false)
      return
    }
    let param = {
      setId: this.options.setId,
      id: id
    }
    this.navigateTo('/pages/question/question-p1-detail/index' + api.parseParams(param))
  },
  recordingOrClocking() {
    // 判断是否所有题目都存在题目音频
    var emptyAudioCount = this.data.list.filter(function (item) {
      return api.isEmpty(item.audioUrl)
    }).length
    if (emptyAudioCount != 0) {
      api.toast("请联系小助手补充数据")
      return
    }
    // 整理跳转选项
    let menu = []
    let menuUrl = []
    let param = {
      type: 1,
      setId: this.options.setId,
    }
    menu.push('录音')
    menuUrl.push('/pages/recording/p1-multi-record/index' + api.parseParams(param))
    menu.push('历史录音')
    menuUrl.push('/pages/recording/p1-multi-record-list/index' + api.parseParams(param))

    const _this = this
    wx.showActionSheet({
      itemList: menu,
      success(res) {
        _this.navigateTo(menuUrl[res.tapIndex])
      }
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(showLoading) {
    api.request(this, '/question/v2/p1/list', {
      setType: 1,
      ...this.options
    }, showLoading, 'GET', false)  // autoSetData = false，手动处理数据
      .then(res => {
        // 使用 diff 更新，只更新变化的字段
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
  },
  saveMastered() {
    api.request(this, '/v2/unit/p1/update/mastered', {
      unitId: this.options.setId,
      isMastered: this.data.hasMastered
    }, 'false')
  }
  // ===========数据获取 End===========
})
