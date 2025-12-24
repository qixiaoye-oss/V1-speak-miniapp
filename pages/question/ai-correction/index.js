const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const buttonGroupHeight = require('../../../behaviors/button-group-height')
const api = getApp().api
const audioUtil = require('../../../utils/audioUtil')
let recorderManager = null
let audioContext = null
let timer = null
Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, buttonGroupHeight],
  data: {
    recorderManagerConfig: {
      duration: 600000,
      numberOfChannels: 1,
      format: 'wav'
    },
    file: {
      time: "",
      url: "",
      duration: 0
    },
    list: [],
    saveBatchButShow: false,
    currentButIndex: -1
  },
  // ===========生命周期 Start===========
  onShow() {
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record'
          })
        }
      }
    })
  },
  onLoad(options) {
    this.startLoading()
    this.getData(true)
    this.setData({
      queryParam: options
    })
    recorderManager = wx.getRecorderManager()
    recorderManager.onStop((res) => {
      console.log("停止录音监听")
      if (res.duration < 2000) {
        api.toast('录音时间过短！')
        this.recordingReload()
        return
      }
      this.saveRecordingFile(res)
    })
    recorderManager.onError((res) => {
      // api.modal("录音模块启动失败", res.errMsg, false)
      api.recorderErr("P3", res.errMsg)
    })
    recorderManager.onStart(() => {
      console.log("开始录音监听")
      const { currentButIndex } = this.data
      this.setData({
        [`list[${currentButIndex}].recordingStatus`]: 'playing'
      })
    })
    audioContext = wx.createInnerAudioContext()
    audioContext.onEnded(() => {
      this.audioStopPlay()
    })
    audioContext.onError((err) => {
      // api.audioErr(err, audio.src)
      // api.modal("", "本模块电脑版播放功能需要等待微信官方更新，目前手机/平板可以正常播放。", false)
    })
  },
  onUnload() {
    audioContext.destroy()
    if (recorderManager) {
      recorderManager.stop()
    }
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 听句子
  listenSentence(e) {
    let list = this.data.list
    let data = e.currentTarget.dataset
    //判断是否正在录音
    const hsaRecording = list.some(item => item.recordingStatus === 'playing');
    if (hsaRecording) {
      return
    }
    //判断是否正在播放录音
    const hsaRecordingPlay = list.some(item => item.recordingPlayStatus === 'playing');
    if (hsaRecordingPlay) {
      return
    }
    //点击当前播放句
    const index = list.findIndex(item => item.audioPlayStatus === 'playing');
    if (index == data.index) {
      return
    }
    // 停止播放
    audioContext.stop()
    this.audioStopPlay()
    // 开始播放
    audioContext.src = list[data.index].audioUrl
    wx.nextTick(() => {
      audioContext.play()
      let path = `list[` + data.index + `].audioPlayStatus`
      this.setData({
        [path]: 'playing'
      })
    })
  },
  // 停止音频播放
  audioStopPlay() {
    let list = this.data.list
    list.forEach(item => {
      item.recordingPlayStatus = 'stopped'
      item.audioPlayStatus = 'stopped'
    })
    this.setData({
      list: list
    })
  },
  // 点击录音按钮
  recordingChange({ currentTarget: { dataset: { index } } }) {
    this.setData({ currentButIndex: index })
    let list = this.data.list
    // 判断音频是否正在播放
    const hasAudioPlay = list.some(item => item.audioPlayStatus === 'playing');
    if (hasAudioPlay) {
      api.toast("无法录音，因为有音频正在播放")
      return
    }
    // 判断录音是否正在播放
    const hsaRecordingPlay = list.some(item => item.recordingPlayStatus === 'playing');
    if (hsaRecordingPlay) {
      api.toast("无法录音，因为有录音正在播放")
      return
    }
    const recordingItem = list.find(item => item.recordingStatus === 'playing');
    // 判断点击的录音按钮是否未正在录音的句子，如果是则停止录音，如果不是提示正在录音中
    let targetItem = list[index]
    if (recordingItem !== undefined && recordingItem.id !== targetItem.id) {
      api.toast("无法开启新录音，因为正在录音中")
      return
    }
    //开始新录音
    if (recordingItem == undefined) {
      this.verifyRecordingAuthorization()
    } else {
      console.log("停止录音")
      recorderManager.stop()
    }
  },
  // 验证录音授权
  verifyRecordingAuthorization() {
    const { recorderManagerConfig } = this.data
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.record']) {
          console.log("权限验证通过，开始录音")
          recorderManager.start(recorderManagerConfig)
        } else {
          api.toast("未开启麦克风权限无法进行录音")
        }
      }
    })
  },
  // 结束录音，回填临时文件地址
  saveRecordingFile(data) {
    let list = this.data.list
    const index = list.findIndex(item => item.recordingStatus === 'playing');
    let statusPath = `list[` + index + `].recordingStatus`
    let fileTimePath = `list[` + index + `].recordingTime`
    let fileUrlPath = `list[` + index + `].recordingUrl`
    let fileDurationPath = `list[` + index + `].duration`
    let statePath = `list[` + index + `].state`
    let time = api.formatTime(new Date())
    this.setData({
      [statusPath]: 'stopped',
      [fileTimePath]: time,
      [fileUrlPath]: data.tempFilePath,
      [fileDurationPath]: data.duration,
      [statePath]: 1
    })
    audioUtil.saveRecordToCache(list[index].id, data.tempFilePath)
    this.saveBatchIsShow()
  },
  //录音时间过短状态修改
  recordingReload() {
    let list = this.data.list
    const index = list.findIndex(item => item.recordingStatus === 'playing');
    let recordingStatusPath = `list[` + index + `].recordingStatus`
    let recordingPlayStatusPath = `list[` + index + `].recordingPlayStatus`
    let statePath = `list[` + index + `].state`
    this.setData({
      [recordingStatusPath]: 'stopped',
      [recordingPlayStatusPath]: 'stopped',
      [statePath]: 1
    })
  },
  recordingPlayChange(e) {
    let list = this.data.list
    let data = e.currentTarget.dataset
    //判断是否正在录音
    const hsaRecording = list.some(item => item.recordingStatus === 'playing');
    if (hsaRecording) {
      return
    }
    //判断是否正在播放句子
    const hsaAudioPlay = list.some(item => item.audioPlayStatus === 'playing');
    if (hsaAudioPlay) {
      return
    }
    //点击当前播放句
    const index = list.findIndex(item => item.recordingPlayStatus === 'playing');
    if (index == data.index) {
      audioContext.stop()
      this.audioStopPlay()
      return
    }
    // 停止播放
    audioContext.stop()
    this.audioStopPlay()
    // 开始播放
    audioContext.src = list[data.index].recordingUrl
    wx.nextTick(() => {
      audioContext.play()
      let path = `list[` + data.index + `].recordingPlayStatus`
      this.setData({
        [path]: 'playing'
      })
    })
  },
  toWordDetail({ currentTarget: { dataset } }) {
    this.navigateTo('/pages/question/ai-correction-detail/index' + api.parseParams(dataset))
  },
  //批量上传录音文件
  async batchSaveRecord() {
    let _this = this
    let errTotal = 0
    let listData = []
    const map = new Map();
    wx.showLoading({
      title: '录音上传中...',
      mask: true
    })
    let list = this.data.list
    for (let item of list) {
      if (item.recordingUrl) {
        try {
          let res = await audioUtil.uploadReading(item.recordingUrl, '/', _this)
          listData.push({
            sentenceId: item.id,
            audioUrl: res,
            recordingTime: item.recordingTime,
            duration: item.duration
          })
          map.set(item.id, res);
          //删除缓存记录
          audioUtil.delRecordToCache(item.id)
        } catch (error) {
          errTotal++
        }
      }
    }
    this.batchSaveRecordingFile(listData, map)
    this.saveBatchIsShow()
  },
  //验证是否存在需要上传的音频文件
  saveBatchIsShow() {
    const hasRecording = this.data.list.some(item => !!item.recordingUrl);
    this.setData({
      saveBatchButShow: hasRecording
    });
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  getData(isPull) {
    this.hideLoadError()
    api.request(this, '/rating/v2/sentence/list', {
      // api.request(this, '/question/listSentences', {
      ...this.options
    }, isPull).then(res => {
      let list = res.list
      list.forEach((i) => {
        i['audioPlayStatus'] = 'stopped'
        i['recordingPlayStatus'] = 'stopped'
        i['recordingStatus'] = 'stopped'
      })
      this.setData({
        list: list
      })
      audioUtil.loadRecordedSentences(this)
      this.saveBatchIsShow()
      this.setDataReady()
      this.updateButtonGroupHeight()
      this.finishLoading()
    }).catch(() => {
      pageGuard.showRetry(this)
    })
  },
  retryLoad() {
    this.startLoading()
    this.getData(true)
  },
  batchSaveRecordingFile(listData, map) {
    let param = {
      type: this.options.type,
      questionId: this.options.id,
      resourceId: this.options.childId,
      recordings: listData,
    }
    api.request(this, '/rating/v2/add/batch', param, false, "POST").then(() => {
      // api.request(this, '/recording/saveBatchSentenceRecording', param, false, "POST").then(() => {
      let list = this.data.list
      list.forEach(item => {
        if (map.has(item.id)) {
          item.state = 2;
          item.recordingUrl = map.get(item.id);
        }
      })
      this.setData({
        list: list
      })
      wx.hideLoading()
      api.toast("已上传/打分中...")
    })
  }
  // ===========数据获取 End===========
})