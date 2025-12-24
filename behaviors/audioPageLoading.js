/**
 * 音频页面加载 Behavior（组合）
 *
 * 整合 pageLoading 和 audioLoading，提供统一的加载体验：
 * 1. 页面加载时同时启动进度条和音频遮罩
 * 2. 音频遮罩优先显示，避免页面内容闪烁
 * 3. 加载完成后先隐藏遮罩，再完成进度条动画
 *
 * 使用方式：
 * const audioPageLoading = require('../../behaviors/audioPageLoading')
 *
 * Page({
 *   behaviors: [audioPageLoading],
 *
 *   onLoad() {
 *     this.startAudioPageLoading()
 *     this.loadData()
 *   },
 *
 *   loadData() {
 *     api.request(...).then(() => {
 *       return this.downloadAudioWithProgress(url, (localPath) => {
 *         // 音频下载完成
 *       })
 *     }).then(() => {
 *       this.finishAudioPageLoading()
 *     })
 *   }
 * })
 */

const pageLoading = require('./pageLoading')
const audioLoading = require('./audioLoading')

module.exports = Behavior({
  behaviors: [pageLoading, audioLoading],

  methods: {
    /**
     * 开始音频页面加载
     * 同时启动进度条和音频遮罩，遮罩会覆盖在进度条上方
     */
    startAudioPageLoading() {
      this.startLoading()
      this.startAudioLoading()
    },

    /**
     * 完成音频页面加载
     * 先隐藏遮罩，再完成进度条动画（90% → 100%）
     */
    finishAudioPageLoading() {
      this.finishAudioLoading()
      this.finishLoading()
    }
  }
})
