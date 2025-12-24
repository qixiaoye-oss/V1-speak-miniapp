/**
 * 统一单题录音页面
 * 支持 P1/P2/P3 三种类型，通过 type 参数区分
 */
const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const buttonGroupHeight = require('../../../behaviors/button-group-height')

// 页面配置表
const CONFIG = {
  1: {
    errorTag: 'P1',
    needPlayQuestion: true,  // P1 需要先播放题目音频
    detailApi: '/v2/p1/detail',
    saveApi: '/recording/save',
    uploadPath: 'recording/part-one/',
    getSaveParam: (options, file, duration) => ({
      type: options.recordType,
      setId: options.setId,
      resourceId: options.id,
      audioUrl: '',
      recordingTime: file.time,
      duration: duration
    })
  },
  2: {
    errorTag: 'P2',
    needPlayQuestion: false,  // P2 直接开始录音
    detailApi: '/question/detailNoAnswer',
    saveApi: '/recording/save',
    uploadPath: 'recording/part-two/',
    getSaveParam: (options, file, duration) => ({
      type: options.type,
      setId: options.setId,
      resourceId: options.id,
      audioUrl: '',
      recordingTime: file.time,
      duration: duration
    })
  },
  3: {
    errorTag: 'P3',
    needPlayQuestion: true,  // P3 需要先播放题目音频
    detailApi: '/question/v2/p3/audios',
    saveApi: '/recording/save',
    uploadPath: 'recording/part-third/',
    getSaveParam: (options, file, duration) => ({
      type: options.type,
      setId: options.setId,
      resourceId: options.id,
      audioUrl: '',
      recordingTime: file.time,
      duration: duration
    })
  }
}

// 录音配置（统一120秒）
const RECORDER_CONFIG = {
  duration: 120000,
  sampleRate: 48000,
  numberOfChannels: 1,
  encodeBitRate: 320000,
  format: 'mp3',
  frameSize: 50
}

let timer = null
let dotsTimer = null  // 动态点定时器
let manager = null
let audio = null

Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight],

  data: {
    recordType: 1,
    nowTime: 0,
    status: 0,
    file: {
      time: '',
      url: '',
      duration: 0
    },
    audioStatus: 'stop',
    duration: 0,
    dots: '.'  // 动态点，循环显示 . .. ...
  },

  onLoad(options) {
    const recordType = parseInt(options.recordType) || 1
    this.setData({
      recordType,
      color: options.color,
      background: options.background
    })

    this.initAudio()
    this.initRecorder()

    wx.enableAlertBeforeUnload({
      message: '未保存录音退出将丢失录音文件，是否退出？'
    })
  },

  onShow() {
    this.startLoading()
    this.fetchQuestionDetail(true)
    this.checkRecordAuth()
  },

  onUnload() {
    if (audio) {
      audio.stop()
    }
    if (manager) {
      manager.stop()
    }
    if (timer) {
      clearInterval(timer)
    }
    if (dotsTimer) {
      clearInterval(dotsTimer)
    }
  },

  // =========== 初始化 ===========
  initAudio() {
    audio = wx.createInnerAudioContext()
    audio.onEnded(() => {
      const { status, recordType } = this.data
      const config = CONFIG[recordType]
      // 听题状态下音频播放完成，开始录音
      if (status === 0.5 && config.needPlayQuestion) {
        this.setData({ audioStatus: 'stop' })
        manager.start(RECORDER_CONFIG)
      } else {
        this.stopAudio()
      }
    })
    audio.onError((res) => {
      console.log('音频错误:', res)
    })
  },

  initRecorder() {
    const config = CONFIG[this.data.recordType]
    manager = wx.getRecorderManager()

    manager.onStop((res) => {
      audio.src = res.tempFilePath
      const time = api.formatTime(new Date())
      this.setData({
        duration: res.duration,
        'file.time': time,
        'file.url': res.tempFilePath,
        status: 2
      })
      clearInterval(timer)
    })

    manager.onError((res) => {
      api.recorderErr(config.errorTag, res.errMsg)
    })

    manager.onStart(() => {
      this.startRecording()
    })
  },

  checkRecordAuth() {
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.record']) {
          wx.authorize({ scope: 'scope.record' })
        }
      }
    })
  },

  // =========== 录音操作 ===========
  checkRecordPermission() {
    const that = this
    const config = CONFIG[this.data.recordType]
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.record']) {
          if (config.needPlayQuestion) {
            // P1/P3: 先播放题目音频，进入听题状态
            that.startListening()
          } else {
            // P2: 直接开始录音
            manager.start(RECORDER_CONFIG)
          }
        } else {
          api.toast('未开启麦克风权限无法进行录音')
        }
      }
    })
  },

  // 开始听题（仅 P1/P3）
  startListening() {
    this.setData({ status: 0.5 })
    this.startDotsTimer()
    this.playQuestionAudio()
  },

  // 动态点定时器
  startDotsTimer() {
    let dotCount = 1
    dotsTimer = setInterval(() => {
      dotCount = dotCount >= 3 ? 1 : dotCount + 1
      this.setData({ dots: '.'.repeat(dotCount) })
    }, 500)
  },

  stopDotsTimer() {
    if (dotsTimer) {
      clearInterval(dotsTimer)
      dotsTimer = null
    }
  },

  startRecording() {
    this.stopDotsTimer()  // 停止听题阶段的动态点定时器
    this.setData({
      status: 1,
      nowTime: Date.now()
    })
    this.recordingTimer()
  },

  stopRecording() {
    this.setData({ status: 2 })
    manager.stop()
    clearInterval(timer)
  },

  recordingTimer() {
    let dotCount = 1
    timer = setInterval(() => {
      const { nowTime } = this.data
      const difference = Date.now() - nowTime
      // 动态点循环：. → .. → ... → .
      dotCount = dotCount >= 3 ? 1 : dotCount + 1
      this.setData({
        'file.duration': Math.round(difference / 1000),
        dots: '.'.repeat(dotCount)
      })
    }, 500)
  },

  // =========== 音频播放 ===========
  playQuestionAudio() {
    const { recordType, detail, list } = this.data
    let audioUrl = ''

    if (recordType === 3 && list && list.length > 0) {
      audioUrl = list[0].audioUrl
    } else if (detail && detail.audioUrl) {
      audioUrl = detail.audioUrl
    }

    if (audioUrl) {
      audio.src = audioUrl
      this.playAudio()
    }
  },

  playAudio() {
    audio.play()
    this.setData({ audioStatus: 'play' })
  },

  stopAudio() {
    if (audio && !audio.paused) {
      audio.stop()
    }
    this.setData({ audioStatus: 'stop' })
  },

  playRecordedAudio() {
    audio.src = this.data.file.url
    audio.play()
    this.setData({ audioStatus: 'play' })
  },

  // =========== 页面操作 ===========
  cancel() {
    wx.navigateBack()
  },

  confirm() {
    if (api.isEmpty(this.data.file.url)) {
      api.toast('没有录音需要保存')
      return
    }

    const config = CONFIG[this.data.recordType]
    api.uploadFileToOSS(this.data.file.url, config.uploadPath, this).then(res => {
      this.save(res)
    })
  },

  // =========== 数据获取 ===========
  fetchQuestionDetail(isPull) {
    const config = CONFIG[this.data.recordType]
    api.request(this, config.detailApi, {
      ...this.options
    }, isPull).then(() => {
      this.setDataReady()
      this.updateButtonGroupHeight()
      this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(this)
    })
  },

  save(audioUrl) {
    const config = CONFIG[this.data.recordType]
    const param = config.getSaveParam(this.options, this.data.file, this.data.duration)
    param.audioUrl = audioUrl

    api.request(this, config.saveApi, param, true, 'POST').then(() => {
      wx.disableAlertBeforeUnload()
      wx.navigateBack()
    })
  }
})
