/**
 * 页面守卫 Behavior
 *
 * 功能：
 * 1. 定时器安全管理（页面切换时自动清理）
 * 2. 页面状态追踪（活跃、数据就绪）
 * 3. 错误处理策略（goBack、showRetry、finishProgress）
 * 4. 防重复点击/导航
 *
 * 使用方式：
 * const pageGuard = require('../../behaviors/pageGuard')
 *
 * Page({
 *   behaviors: [pageGuard.behavior],
 *
 *   loadData() {
 *     api.request(...).then(() => {
 *       this.setDataReady()
 *     }).catch(() => {
 *       pageGuard.goBack(this)
 *     })
 *   },
 *
 *   onButtonTap() {
 *     this.navigateTo('/pages/xxx/index')
 *   }
 * })
 */

const pageTimers = new WeakMap()
let isNavigating = false
let navigatingTimer = null

function _registerTimer(page, name, callback, delay) {
  if (!pageTimers.has(page)) {
    pageTimers.set(page, new Map())
  }
  const timers = pageTimers.get(page)

  if (timers.has(name)) {
    clearTimeout(timers.get(name))
  }

  const timerId = setTimeout(() => {
    timers.delete(name)
    if (page.data._isPageActive) {
      callback()
    }
  }, delay)

  timers.set(name, timerId)
  return timerId
}

function _clearPageTimers(page) {
  const timers = pageTimers.get(page)
  if (timers) {
    timers.forEach(id => clearTimeout(id))
    timers.clear()
  }
}

function _lockNavigation(duration = 1500) {
  isNavigating = true
  if (navigatingTimer) {
    clearTimeout(navigatingTimer)
  }
  navigatingTimer = setTimeout(() => {
    isNavigating = false
  }, duration)
}

function _unlockNavigation() {
  isNavigating = false
  if (navigatingTimer) {
    clearTimeout(navigatingTimer)
    navigatingTimer = null
  }
}

function _finishAllLoading(page) {
  if (page.finishLoading) page.finishLoading()
  if (page.finishAudioLoading) page.finishAudioLoading()
}

function goBack(page) {
  _finishAllLoading(page)

  if (page.registerTimer) {
    page.registerTimer('__goBack', () => wx.navigateBack(), 1500)
  } else {
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages[pages.length - 1] === page) {
        wx.navigateBack()
      }
    }, 1500)
  }
}

function showRetry(page) {
  _finishAllLoading(page)
  if (page.showLoadError) {
    page.showLoadError()
  } else {
    page.setData({ loadError: true })
  }
}

function finishProgress(page) {
  _finishAllLoading(page)
}

function checkIsNavigating() {
  return isNavigating
}

const behavior = Behavior({
  data: {
    _isPageActive: true,
    _isDataReady: false
  },

  pageLifetimes: {
    show() {
      this.setData({ _isPageActive: true })
      _unlockNavigation()
    },
    hide() {
      this.setData({ _isPageActive: false })
      _clearPageTimers(this)
    }
  },

  lifetimes: {
    detached() {
      _clearPageTimers(this)
    }
  },

  methods: {
    registerTimer(name, callback, delay) {
      return _registerTimer(this, name, callback, delay)
    },

    cancelTimer(name) {
      const timers = pageTimers.get(this)
      if (timers && timers.has(name)) {
        clearTimeout(timers.get(name))
        timers.delete(name)
      }
    },

    setDataReady() {
      this.setData({ _isDataReady: true })
    },

    isDataReady() {
      return this.data._isDataReady
    },

    navigateTo(url, options = {}) {
      if (isNavigating) return false

      if (options.checkReady !== false && !this.data._isDataReady) {
        wx.showToast({ title: options.loadingMsg || '数据加载中...', icon: 'none' })
        return false
      }

      _lockNavigation()
      wx.navigateTo({
        url,
        fail: () => _unlockNavigation()
      })
      return true
    },

    redirectTo(url) {
      if (isNavigating) return false
      _lockNavigation()
      wx.redirectTo({
        url,
        fail: () => _unlockNavigation()
      })
      return true
    },

    navigateBack(delta = 1) {
      if (isNavigating) return false
      _lockNavigation()
      wx.navigateBack({
        delta,
        fail: () => _unlockNavigation()
      })
      return true
    },

    switchTab(url) {
      if (isNavigating) return false
      _lockNavigation()
      wx.switchTab({
        url,
        fail: () => _unlockNavigation()
      })
      return true
    },

    throttleAction(name, fn, delay = 1000) {
      const key = `_throttle_${name}`
      if (this[key]) return false

      this[key] = true
      this.registerTimer(`__throttle_${name}`, () => {
        this[key] = false
      }, delay)

      fn()
      return true
    }
  }
})

module.exports = {
  behavior: behavior,
  goBack: goBack,
  showRetry: showRetry,
  finishProgress: finishProgress,
  isNavigating: checkIsNavigating
}
