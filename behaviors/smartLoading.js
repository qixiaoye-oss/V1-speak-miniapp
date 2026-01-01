/**
 * 智能加载控制 Behavior
 * 解决页面在 onShow 时反复加载的问题
 *
 * 使用方法：
 * 1. 在页面中引入: const smartLoading = require('../../behaviors/smartLoading')
 * 2. 添加到 behaviors: behaviors: [smartLoading]
 * 3. 在 onShow 中使用: if (this.shouldLoad()) { this.loadData() }
 *
 * 刷新策略：
 * - 首次进入：全量刷新（显示骨架屏）
 * - 从后台返回：不刷新
 * - 从子页面返回（无操作）：不刷新
 * - 从子页面返回（有操作）：静默刷新（子页面需调用 markNeedRefresh）
 * - 下拉刷新：全量刷新
 */

module.exports = Behavior({
  data: {
    _hasLoaded: false,        // 是否已首次加载完成
    _needRefresh: false,      // 是否需要刷新（由子页面设置）
    _lastLoadTime: 0,         // 上次加载时间戳
  },

  methods: {
    /**
     * 判断是否需要加载数据（用于 onShow）
     * @param {Object} options 配置项
     * @param {number} options.cacheTime 缓存有效期（毫秒），默认不过期
     * @param {boolean} options.forceRefresh 强制刷新
     * @returns {boolean} 是否需要加载
     */
    shouldLoad(options = {}) {
      const { cacheTime = 0, forceRefresh = false } = options

      // 强制刷新
      if (forceRefresh) {
        return true
      }

      // 首次加载
      if (!this.data._hasLoaded) {
        return true
      }

      // 缓存过期检查
      if (cacheTime > 0) {
        const now = Date.now()
        if (now - this.data._lastLoadTime > cacheTime) {
          return true
        }
      }

      return false
    },

    /**
     * 判断是否需要静默刷新（用于 onShow）
     * @returns {boolean} 是否需要静默刷新
     */
    shouldSilentRefresh() {
      return this.data._needRefresh
    },

    /**
     * 标记数据已加载完成
     * 在数据加载成功后调用
     */
    markLoaded() {
      this.setData({
        _hasLoaded: true,
        _lastLoadTime: Date.now()
      })
    },

    /**
     * 标记需要刷新
     * 供子页面调用，通知父页面在返回时刷新数据
     */
    markNeedRefresh() {
      this.setData({ _needRefresh: true })
    },

    /**
     * 清除刷新标记
     * 在静默刷新开始时调用
     */
    clearRefreshMark() {
      this.setData({ _needRefresh: false })
    },

    /**
     * 重置加载状态
     * 用于强制重新加载（如下拉刷新）
     */
    resetLoadState() {
      this.setData({
        _hasLoaded: false,
        _lastLoadTime: 0
      })
    },

    /**
     * 检查是否从后台返回
     * @returns {boolean}
     */
    isFromBackground() {
      const app = getApp()
      if (app._fromBackground) {
        app._fromBackground = false
        return true
      }
      return false
    },

    /**
     * 检查是否从图片预览返回
     * @returns {boolean}
     */
    isFromImagePreview() {
      const app = getApp()
      if (app._fromImagePreview) {
        app._fromImagePreview = false
        return true
      }
      return false
    },

    /**
     * 通知上级页面需要刷新
     * 在打卡、录音等操作成功后调用
     * @param {number} levels 向上查找的层级数，默认查找所有上级页面
     */
    notifyParentRefresh(levels = -1) {
      const pages = getCurrentPages()
      const startIndex = levels === -1 ? 0 : Math.max(0, pages.length - 1 - levels)

      for (let i = pages.length - 2; i >= startIndex; i--) {
        const page = pages[i]
        if (page && page.markNeedRefresh) {
          page.markNeedRefresh()
        }
      }
    }
  }
})
