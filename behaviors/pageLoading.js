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
 *
 * 优化说明：
 * - 使用 CSS transition 实现进度动画，减少 setData 调用次数
 * - 原方案：每100ms调用一次setData（约9-10次）
 * - 优化后：整个加载过程只调用2-3次setData
 */

module.exports = Behavior({
  data: {
    loading: false,
    loadProgress: 0
  },

  methods: {
    /**
     * 开始加载 - 显示进度条并启动进度动画
     * 优化：使用 CSS transition，只需一次 setData 即可启动动画
     */
    startLoading() {
      // 清理可能存在的定时器
      if (this._progressTimer) {
        clearTimeout(this._progressTimer)
        this._progressTimer = null
      }

      // 第一次 setData：显示进度条，初始进度为 5%
      this.setData({
        loading: true,
        loadProgress: 5
      })

      // 延迟一帧后设置目标进度，触发 CSS transition 动画
      this._progressTimer = setTimeout(() => {
        // 第二次 setData：设置目标进度 90%，CSS 会自动动画过渡
        this.setData({
          loadProgress: 90
        })
      }, 50)
    },

    /**
     * 完成加载 - 进度条快速到达100%后隐藏
     */
    finishLoading() {
      // 清理定时器
      if (this._progressTimer) {
        clearTimeout(this._progressTimer)
        this._progressTimer = null
      }

      // 第一次 setData：快速完成到 100%
      this.setData({
        loadProgress: 100
      })

      // 延迟后隐藏进度条
      setTimeout(() => {
        // 第二次 setData：隐藏进度条
        this.setData({
          loading: false,
          loadProgress: 0
        })
      }, 200)
    }
  }
})
