/**
 * 音频列表 Behavior
 * 用于录音列表页面的公共逻辑
 *
 * 使用方法：
 * 1. 在页面中引入: const audioListBehavior = require('../../behaviors/audioListBehavior')
 * 2. 添加到 behaviors: behaviors: [audioListBehavior]
 * 3. 在 onLoad 中调用 this.initAudioListBehavior() 初始化
 * 4. 在 onUnload 中调用 this.destroyAudioListBehavior() 销毁
 *
 * 提供的方法：
 * - playRecording(e): 播放列表中的音频
 * - stopAudio(): 停止音频播放
 * - audioBtn(e): 显示音频操作菜单
 *
 * 需要页面实现的方法：
 * - delRecording(id): 删除录音
 */

const api = getApp().api

module.exports = Behavior({
  methods: {
    /**
     * 初始化音频列表 Behavior
     * 在页面 onLoad 中调用
     */
    initAudioListBehavior() {
      this._listAudio = wx.createInnerAudioContext()
      this._listAudio.onPlay(() => {
        console.log('开始播放', new Date().getTime())
      })
      this._listAudio.onEnded(() => {
        this.stopAudio()
      })
      this._listAudio.onError((err) => {
        api.audioErr(err, this._listAudio.src)
      })
    },

    /**
     * 销毁音频列表 Behavior
     * 在页面 onUnload 中调用
     */
    destroyAudioListBehavior() {
      if (this._listAudio) {
        this._listAudio.destroy()
      }
    },

    /**
     * 播放录音
     * @param {Object} e - 事件对象，包含 dataset.index
     */
    playRecording(e) {
      this.stopAudio()
      const playIndex = e.currentTarget.dataset.index
      const list = this.data.list
      this._listAudio.src = list[playIndex].audioUrl
      wx.nextTick(() => {
        this._listAudio.play()
      })
      const path = `list[${playIndex}].playStatus`
      this.setData({
        [path]: 'play'
      })
    },

    /**
     * 停止音频播放
     */
    stopAudio() {
      if (this._listAudio && !this._listAudio.paused) {
        this._listAudio.stop()
      }
      const list = this.data.list
      if (list) {
        list.forEach((item) => {
          item.playStatus = 'stop'
        })
        this.setData({
          list: list
        })
      }
    },

    /**
     * 音频操作按钮（删除等）
     * @param {Object} e - 事件对象，包含 dataset.id
     */
    audioBtn(e) {
      const id = e.currentTarget.dataset.id
      wx.showActionSheet({
        itemList: ['删除音频'],
        success: ((res) => {
          if (res.tapIndex === 0) {
            this.delRecording(id)
          }
        })
      })
    }
  }
})
