/**
 * 页面加载进度条 Behavior
 * 用于在导航栏下方显示线性加载进度条
 *
 * 使用方法：
 * 1. 在页面中引入: const pageLoading = require('../../behaviors/pageLoading')
 * 2. 添加到 behaviors: behaviors: [pageLoading]
 * 3. 在 wxml 中引入模板: <import src="/templates/page-loading.wxml"/>
 * 4. 使用模板: <template is="pageLoading" data="{{loading, loadProgress}}"/>
 * 5. 调用方法: this.startLoading() / this.finishLoading()
 */

module.exports = Behavior({
  data: {
    loading: false,
    loadProgress: 0
  },

  methods: {
    /**
     * 开始加载 - 显示进度条并开始模拟进度
     */
    startLoading() {
      this.setData({
        loading: true,
        loadProgress: 0
      })
      this.simulateProgress()
    },

    /**
     * 模拟进度 - 进度条从0缓慢增长到90%
     * 使用递减增量算法，越接近90%增长越慢
     */
    simulateProgress() {
      const that = this
      let progress = 0
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
      }
      this.progressTimer = setInterval(() => {
        if (progress < 90) {
          // 递减增量：距离90越近，增量越小
          const increment = Math.max(1, (90 - progress) / 10)
          progress = Math.min(90, progress + increment)
          that.setData({
            loadProgress: progress
          })
        }
      }, 100)
    },

    /**
     * 完成加载 - 进度条快速到达100%后隐藏
     */
    finishLoading() {
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
      this.setData({
        loadProgress: 100
      })
      // 延迟300ms后隐藏进度条，让用户看到完成效果
      setTimeout(() => {
        this.setData({
          loading: false,
          loadProgress: 0
        })
      }, 300)
    }
  }
})
