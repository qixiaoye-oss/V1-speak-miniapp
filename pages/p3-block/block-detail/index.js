const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const pageGuard = require('../../../behaviors/pageGuard')
const buttonGroupHeight = require('../../../behaviors/button-group-height')

let audio = null
Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight],
  data: {
    audioStatus: 'stop',
    showReportModal: false,
    audioPlayer: false,
    tagLength: 0,
    maxWidth: ''
  },
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.setData({ queryParam: this.options })
    this.getData(true)
  },
  onLoad(options) {
    audio = wx.createInnerAudioContext()
    audio.onPlay(() => {
      console.log('开始播放', new Date().getTime());
    })
    audio.onEnded(() => {
      this.resetSentenceAudioStatus()
    })
    audio.onError((err) => {
      api.audioErr(err, audio.src)
      // api.modal("", "本模块电脑版播放功能需要等待微信官方更新，目前手机/平板可以正常播放。", false)
    })
  },
  onUnload() {
    audio.stop()
    audio.destroy()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 点击句子播放
  playSentence(e) {
    const { paragraphIndex, sentenceIndex } = e.currentTarget.dataset
    const { list } = this.data
    // 2、没有开启跟读则停止正在播放的音频，播放点击的句子，如果存在句子音频
    let sentence = list[paragraphIndex].list[sentenceIndex]
    if (sentence.audioUrl) {
      this.stopAudio()
      this.resetSentenceAudioStatus()
      this.playAudio(sentence.audioUrl)
      let path = `list[${paragraphIndex}].list[${sentenceIndex}].playStatus`;
      this.setData({
        [path]: 'playing',
      })
    }
  },
  // 播放音频
  playAudio(path) {
    audio.src = path
    wx.nextTick(() => {
      audio.play()
      this.setData({
        audioPlayer: true
      })
    })
  },
  // 停止音频播放
  stopAudio() {
    if (this.data.audioPlayer) {
      audio.stop()
    }
    this.setData({
      audioPlayer: false,
    })
  },
  // 重置句子音频播放状态
  resetSentenceAudioStatus() {
    const resetStatus = (data) => {
      return data.map(item => {
        if (item.list && item.list.length > 0) {
          return {
            ...item,
            list: resetStatus(item.list)
          };
        } else {
          return {
            ...item,
            playStatus: 'none'
          };
        }
      });
    };
    this.setData({
      list: resetStatus(this.data.list)
    })
  },
  goBack() {
    wx.navigateBack()
  },
  popupCancel() {
    this.setData({
      showPopus: false
    })
  },
  // 录音并评分
  recordAndRate() {
    const { detail } = this.data
    let param = {
      type: 5,
      id: detail.id,
      childId: detail.id
    }
    // 新版开始跟读
    this.navigateTo('/pages/question/ai-correction/index' + api.parseParams(param))
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  getData(isPull) {
    this.setData({ maxWidth: '' })
    api.request(this, '/material/v2/getDetail', {
      ...this.data.queryParam
    }, isPull)
      .then(() => {
        this.setDataReady()
        this.updateButtonGroupHeight()
      })
      .catch(() => { pageGuard.goBack(this) })
      .finally(() => { this.finishLoading() })
  },
  popupConfirm(e) {
    api.request(this, '/question/signIn', {
      setId: this.options.setId,
      resourceId: this.data.detail.id,
      type: 5
    }, false, "POST").then(res => {
      api.toast("打卡成功")
      // setTimeout(() => {
      //   wx.navigateBack()
      // }, 2000)
    })
  },
  // ===========数据获取 End===========
})