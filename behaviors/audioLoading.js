/**
 * 音频加载进度 Behavior
 * 用于显示音频文件下载的饼状进度动效
 *
 * 使用方法：
 * 1. 在页面中引入: const audioLoading = require('../../behaviors/audioLoading')
 * 2. 添加到 behaviors: behaviors: [audioLoading]
 * 3. 在 wxml 中引入模板: <import src="/templates/audio-loading.wxml"/>
 * 4. 使用模板: <template is="audioLoading" data="{{audioDownProgress, loadingText: '音频加载中...', themeColor: '#00A6ED'}}"/>
 * 5. 调用方法: this.downloadAudioWithProgress(url, onSuccess, onFail)
 */

module.exports = Behavior({
  data: {
    audioDownProgress: 100  // 默认100表示不显示加载蒙版
  },

  methods: {
    /**
     * 开始音频加载 - 重置进度为0，显示加载蒙版
     */
    startAudioLoading() {
      this.setData({
        audioDownProgress: 0
      })
    },

    /**
     * 更新音频加载进度
     * @param {number} progress - 进度值 0-100
     */
    updateAudioProgress(progress) {
      this.setData({
        audioDownProgress: progress
      })
    },

    /**
     * 完成音频加载 - 设置进度为100，隐藏加载蒙版
     */
    finishAudioLoading() {
      this.setData({
        audioDownProgress: 100
      })
    },

    /**
     * 带进度显示的音频下载方法
     * @param {string} url - 音频文件URL
     * @param {function} onSuccess - 下载成功回调，参数为本地临时文件路径
     * @param {function} onFail - 下载失败回调，参数为错误信息
     */
    downloadAudioWithProgress(url, onSuccess, onFail) {
      const that = this

      // 开始加载
      this.startAudioLoading()

      // 创建下载任务
      const downloadTask = wx.downloadFile({
        url: url,
        success(res) {
          if (res.statusCode === 200) {
            that.finishAudioLoading()
            if (typeof onSuccess === 'function') {
              onSuccess(res.tempFilePath)
            }
          } else {
            that.finishAudioLoading()
            if (typeof onFail === 'function') {
              onFail({ errMsg: '下载失败，状态码：' + res.statusCode })
            }
          }
        },
        fail(error) {
          that.finishAudioLoading()
          if (typeof onFail === 'function') {
            onFail(error)
          }
        }
      })

      // 监听下载进度
      downloadTask.onProgressUpdate((res) => {
        that.updateAudioProgress(res.progress)
      })

      return downloadTask
    }
  }
})
