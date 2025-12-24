# 加载状态管理指南

微信小程序加载状态管理的统一方案，包含加载动效、错误处理策略、页面安全守卫和复用指南。

> **本文档目标**：确保其他项目通过阅读本文档，可以**完整、正确地复用**整套加载状态管理系统。

**版本：** v4.2.0
**更新日期：** 2025-12-10

---

## 目录

1. [概述](#一概述)
2. [文件结构与依赖](#二文件结构与依赖)
3. [完整源码](#三完整源码)
4. [使用方法](#四使用方法)
5. [错误处理策略](#五错误处理策略)
6. [迁移到其他项目](#六迁移到其他项目)
7. [常见问题](#七常见问题)
8. [迁移检查清单](#八迁移检查清单)
9. [变更日志](#九变更日志)

---

## 一、概述

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           加载状态管理体系                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 第1层：加载动效（视觉反馈）                                           │   │
│  │   ├─ pageLoading     页面顶部进度条，模拟加载进度 0→90→100           │   │
│  │   ├─ audioLoading    全屏圆饼进度，显示实际音频下载进度               │   │
│  │   └─ audioPageLoading 组合上述两者，用于音频页面                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 第2层：全局 API 兜底                                                  │   │
│  │   └─ api.js 请求超过1秒自动显示原生 loading                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 第3层：页面守卫 + 错误处理（pageGuard）                               │   │
│  │   ├─ 定时器安全管理    页面隐藏/卸载时自动清理，防止内存泄漏          │   │
│  │   ├─ 导航锁            防止快速点击导致多次跳转                       │   │
│  │   ├─ 数据就绪状态      确保数据加载完成后才响应操作                   │   │
│  │   └─ 错误处理策略      goBack / showRetry / finishProgress          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 第4层：加载失败 UI（loadError）                                       │   │
│  │   └─ 显示"加载失败"文案 + 重试按钮                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块关系图

```
                    ┌──────────────────┐
                    │    pageGuard     │ ← 页面守卫（必须）
                    │   .behavior      │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ pageLoading  │ │ audioLoading │ │  loadError   │
    │  页面进度条   │ │  音频进度    │ │  失败重试    │
    └──────────────┘ └──────────────┘ └──────────────┘
            │                │
            └────────┬───────┘
                     ▼
            ┌──────────────────┐
            │ audioPageLoading │ ← 组合 Behavior
            │  音频页面专用     │
            └──────────────────┘
```

### 1.3 文件清单

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| **Behavior** | `behaviors/pageGuard.js` | 页面守卫（核心） |
| **Behavior** | `behaviors/pageLoading.js` | 页面进度条 |
| **Behavior** | `behaviors/audioLoading.js` | 音频加载进度 |
| **Behavior** | `behaviors/audioPageLoading.js` | 组合 Behavior |
| **Behavior** | `behaviors/loadError.js` | 加载失败状态 |
| **模板** | `templates/page-loading.wxml` | 进度条模板 |
| **模板** | `templates/audio-loading.wxml` | 音频加载模板 |
| **模板** | `templates/load-error.wxml` | 失败重试模板 |
| **样式** | `style/page-loading.wxss` | 进度条样式 |
| **样式** | `style/audio-loading.wxss` | 音频加载样式 |
| **样式** | `style/load-error.wxss` | 失败重试样式 |

---

## 二、文件结构与依赖

### 2.1 目录结构

```
project/
├── app.js                      # 全局注册 pageGuard
├── app.wxss                    # 引入所有样式
├── behaviors/
│   ├── pageGuard.js            # 【核心】页面守卫
│   ├── pageLoading.js          # 页面进度条
│   ├── audioLoading.js         # 音频加载进度
│   ├── audioPageLoading.js     # 组合 Behavior
│   └── loadError.js            # 加载失败状态
├── templates/
│   ├── page-loading.wxml       # 进度条模板
│   ├── audio-loading.wxml      # 音频加载模板
│   └── load-error.wxml         # 失败重试模板
├── style/
│   ├── page-loading.wxss       # 进度条样式
│   ├── audio-loading.wxss      # 音频加载样式
│   └── load-error.wxss         # 失败重试样式
└── pages/
    └── xxx/
        ├── index.js            # 引入 behaviors
        └── index.wxml          # 引入 templates
```

### 2.2 依赖关系

```
app.wxss
  └── @import "style/page-loading.wxss"
  └── @import "style/audio-loading.wxss"
  └── @import "style/load-error.wxss"

页面.js
  └── require('behaviors/pageGuard')      → 导出 { behavior, goBack, showRetry, finishProgress }
  └── require('behaviors/pageLoading')    → 导出 Behavior
  └── require('behaviors/loadError')      → 导出 Behavior

页面.wxml
  └── <import src="/templates/page-loading.wxml" />
  └── <import src="/templates/load-error.wxml" />
```

---

## 三、完整源码

### 3.1 behaviors/pageGuard.js

> **说明**：页面守卫是整套系统的核心，提供定时器管理、导航锁、错误处理策略。

```js
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

// ============================================================
// 全局状态
// ============================================================

const pageTimers = new WeakMap()
let isNavigating = false
let navigatingTimer = null

// ============================================================
// 定时器管理（内部）
// ============================================================

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

// ============================================================
// 导航锁管理（内部）
// ============================================================

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

// ============================================================
// 错误处理工具函数（静态方法）
// ============================================================

function _finishAllLoading(page) {
  if (page.finishLoading) page.finishLoading()
  if (page.finishAudioLoading) page.finishAudioLoading()
}

/**
 * 策略A：退回上一级
 * 适用场景：详情页、子页面初始化加载失败
 * @param {Object} page - 页面实例
 */
function goBack(page) {
  _finishAllLoading(page)

  if (page.registerTimer) {
    page.registerTimer('__goBack', () => wx.navigateBack(), 1500)
  } else {
    // 降级处理：兼容未使用 pageGuard 的页面
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages[pages.length - 1] === page) {
        wx.navigateBack()
      }
    }, 1500)
  }
}

/**
 * 策略B：显示重试按钮
 * 适用场景：首页、列表页初始化加载失败
 * @param {Object} page - 页面实例
 */
function showRetry(page) {
  _finishAllLoading(page)
  if (page.showLoadError) {
    page.showLoadError()
  } else {
    page.setData({ loadError: true })
  }
}

/**
 * 策略E：仅结束进度
 * 适用场景：非关键数据加载失败
 * @param {Object} page - 页面实例
 */
function finishProgress(page) {
  _finishAllLoading(page)
}

/**
 * 检查是否正在导航中
 * @returns {boolean}
 */
function checkIsNavigating() {
  return isNavigating
}

// ============================================================
// Behavior 定义
// ============================================================

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
    // ==================== 定时器管理 ====================

    /**
     * 注册安全定时器（页面隐藏时自动取消）
     * @param {string} name - 定时器名称
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟毫秒数
     */
    registerTimer(name, callback, delay) {
      return _registerTimer(this, name, callback, delay)
    },

    /**
     * 取消指定定时器
     * @param {string} name - 定时器名称
     */
    cancelTimer(name) {
      const timers = pageTimers.get(this)
      if (timers && timers.has(name)) {
        clearTimeout(timers.get(name))
        timers.delete(name)
      }
    },

    // ==================== 数据状态管理 ====================

    /**
     * 标记数据已就绪
     */
    setDataReady() {
      this.setData({ _isDataReady: true })
    },

    /**
     * 检查数据是否就绪
     * @returns {boolean}
     */
    isDataReady() {
      return this.data._isDataReady
    },

    // ==================== 安全导航（防重复点击） ====================

    /**
     * 安全导航到新页面
     * @param {string} url - 页面路径
     * @param {object} options - 配置项
     * @param {boolean} options.checkReady - 是否检查数据就绪，默认 true
     * @param {string} options.loadingMsg - 数据未就绪时的提示
     * @returns {boolean} 是否成功发起导航
     */
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

    /**
     * 安全重定向
     * @param {string} url - 页面路径
     * @returns {boolean}
     */
    redirectTo(url) {
      if (isNavigating) return false
      _lockNavigation()
      wx.redirectTo({
        url,
        fail: () => _unlockNavigation()
      })
      return true
    },

    /**
     * 安全返回
     * @param {number} delta - 返回层数，默认 1
     * @returns {boolean}
     */
    navigateBack(delta = 1) {
      if (isNavigating) return false
      _lockNavigation()
      wx.navigateBack({
        delta,
        fail: () => _unlockNavigation()
      })
      return true
    },

    /**
     * 安全切换 Tab
     * @param {string} url - Tab 页面路径
     * @returns {boolean}
     */
    switchTab(url) {
      if (isNavigating) return false
      _lockNavigation()
      wx.switchTab({
        url,
        fail: () => _unlockNavigation()
      })
      return true
    },

    // ==================== 防重复操作 ====================

    /**
     * 节流操作（同一操作在指定时间内只执行一次）
     * @param {string} name - 操作名称
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 节流时间（毫秒），默认 1000
     * @returns {boolean} 是否成功执行
     */
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

// ============================================================
// 导出（使用包装对象避免修改 Behavior 返回值）
// ============================================================

module.exports = {
  // Behavior 本身（用于 behaviors 数组）
  behavior: behavior,
  // 静态方法
  goBack: goBack,
  showRetry: showRetry,
  finishProgress: finishProgress,
  isNavigating: checkIsNavigating
}
```

### 3.2 behaviors/pageLoading.js

```js
/**
 * 页面加载进度条 Behavior
 * 用于在页面数据加载时显示顶部进度条动画
 */
module.exports = Behavior({
  data: {
    // 加载进度条状态
    loading: false,
    loadProgress: 0
  },

  methods: {
    /**
     * 开始加载进度条动画
     */
    startLoading() {
      this.setData({
        loading: true,
        loadProgress: 0
      })
      this.simulateProgress()
    },

    /**
     * 模拟进度增长动画
     * 进度增长速度逐渐变慢，最多到90%
     */
    simulateProgress() {
      const that = this
      let progress = 0
      // 清除之前的定时器
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
      }
      this.progressTimer = setInterval(() => {
        if (progress < 90) {
          // 模拟进度增长，速度逐渐变慢
          const increment = Math.max(1, (90 - progress) / 10)
          progress = Math.min(90, progress + increment)
          that.setData({
            loadProgress: progress
          })
        }
      }, 100)
    },

    /**
     * 完成加载，进度条快速到100%后隐藏
     */
    finishLoading() {
      // 清除模拟进度的定时器
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
      // 快速完成到100%
      this.setData({
        loadProgress: 100
      })
      // 延迟隐藏进度条
      setTimeout(() => {
        this.setData({
          loading: false,
          loadProgress: 0
        })
      }, 300)
    }
  }
})
```

### 3.3 behaviors/audioLoading.js

```js
/**
 * 音频加载进度 Behavior
 * 用于显示音频下载的圆饼进度
 */
module.exports = Behavior({
  data: {
    // 音频下载进度 (0-100)，默认100表示不显示遮罩
    audioDownProgress: 100
  },

  methods: {
    /**
     * 开始音频加载（重置进度为0）
     */
    startAudioLoading() {
      this.setData({ audioDownProgress: 0 })
    },

    /**
     * 更新音频加载进度
     * @param {number} progress - 进度值 (0-100)
     */
    updateAudioProgress(progress) {
      this.setData({ audioDownProgress: progress })
    },

    /**
     * 完成音频加载
     */
    finishAudioLoading() {
      this.setData({ audioDownProgress: 100 })
    }
  }
})
```

### 3.4 behaviors/audioPageLoading.js

```js
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
 *       return audioApi.initAudio(url, (progress) => {
 *         this.updateAudioProgress(progress)
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
```

### 3.5 behaviors/loadError.js

```js
/**
 * 加载失败重试 Behavior
 * 用于策略B：显示重试按钮
 *
 * 使用方式：
 * 1. 在页面 JS 中引入：const loadError = require('../../behaviors/loadError')
 * 2. 添加到 behaviors：behaviors: [pageGuard.behavior, pageLoading, loadError]
 * 3. 在 WXML 中引入模板：<import src="/templates/load-error.wxml" />
 * 4. 使用模板：<template is="loadError" data="{{loadError}}" />
 * 5. 实现 retryLoad 方法
 */
module.exports = Behavior({
  data: {
    loadError: false
  },

  methods: {
    /**
     * 显示加载失败状态
     */
    showLoadError() {
      this.setData({ loadError: true })
    },

    /**
     * 隐藏加载失败状态
     */
    hideLoadError() {
      this.setData({ loadError: false })
    }
  }
})
```

### 3.6 templates/page-loading.wxml

```xml
<template name="pageLoading">
  <view class="page-loading-bar" wx:if="{{loading}}">
    <view class="page-loading-bar__inner" style="width: {{loadProgress}}%;"></view>
  </view>
</template>
```

### 3.7 templates/audio-loading.wxml

```xml
<template name="audioLoading">
  <view class="audio-loading-mask" wx:if="{{audioDownProgress < 100}}">
    <view class="audio-loading-pie" style="background: conic-gradient(var(--theme-color, #3478F6) {{audioDownProgress * 3.6}}deg, #f5f5f5 {{audioDownProgress * 3.6}}deg);"></view>
    <view class="audio-loading-text">音频加载中...</view>
  </view>
</template>
```

### 3.8 templates/load-error.wxml

```xml
<template name="loadError">
  <view class="load-error" wx:if="{{loadError}}">
    <view class="load-error__text">加载失败</view>
    <view class="load-error__btn" bindtap="retryLoad">点击重试</view>
  </view>
</template>
```

### 3.9 style/page-loading.wxss

```css
/* 页面加载进度条样式 */
.page-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.05);
  z-index: 9999;
  overflow: hidden;
}

.page-loading-bar__inner {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-color, #007bff), #00c6ff);
  transition: width 0.1s ease-out;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  position: relative;
}

.page-loading-bar__inner::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100px);
  }
  100% {
    transform: translateX(100px);
  }
}
```

### 3.10 style/audio-loading.wxss

```css
/* 音频加载圆饼进度样式 */
.audio-loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.audio-loading-pie {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.audio-loading-text {
  margin-top: 16px;
  color: #333;
  font-size: 14px;
}
```

### 3.11 style/load-error.wxss

```css
/* 加载失败重试样式 */
.load-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.load-error__text {
  font-size: 16px;
  color: #999;
}

.load-error__btn {
  padding: 10px 30px;
  background: var(--theme-color, #007bff);
  color: #fff;
  border-radius: 6px;
  font-size: 15px;
}

.load-error__btn:active {
  opacity: 0.8;
}
```

---

## 四、使用方法

### 4.1 引入方式总览

**重要：** `pageGuard` 导出的是一个对象，使用时需要用 `pageGuard.behavior`：

```js
const pageGuard = require('../../behaviors/pageGuard')   // 导出 { behavior, goBack, showRetry, ... }
const pageLoading = require('../../behaviors/pageLoading') // 导出 Behavior
const loadError = require('../../behaviors/loadError')     // 导出 Behavior

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],  // 注意是 pageGuard.behavior
  // ...
})
```

### 4.2 四种页面类型模板

#### 类型1：详情页（策略A - 失败退回）

```js
// pages/detail/index.js
const api = getApp().api
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {},

  onLoad(options) {
    this.startLoading()
    this.loadDetail(options.id)
  },

  loadDetail(id) {
    api.request(this, `/api/detail/${id}`, {}, true).then(res => {
      this.setData({ detail: res })
      this.setDataReady()
      this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(this)  // 失败后1.5秒自动退回
    })
  },

  // 使用安全导航
  toSubPage(e) {
    this.navigateTo('/pages/sub/index?id=' + e.currentTarget.dataset.id)
  }
})
```

```xml
<!-- pages/detail/index.wxml -->
<import src="/templates/page-loading.wxml" />
<template is="pageLoading" data="{{loading, loadProgress}}" />

<view class="content">
  <!-- 页面内容 -->
</view>
```

#### 类型2：列表页（策略B - 失败重试）

```js
// pages/list/index.js
const api = getApp().api
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    list: []
  },

  onShow() {
    this.startLoading()
    this.listData()
  },

  listData() {
    this.hideLoadError()  // 重试时先隐藏错误
    api.request(this, '/api/list', {}, true).then(res => {
      this.setData({ list: res })
      this.setDataReady()
      this.finishLoading()
    }).catch(() => {
      pageGuard.showRetry(this)  // 显示重试按钮
    })
  },

  // 必须实现此方法，供模板调用
  retryLoad() {
    this.startLoading()
    this.listData()
  },

  toDetail(e) {
    this.navigateTo('/pages/detail/index?id=' + e.currentTarget.dataset.id)
  }
})
```

```xml
<!-- pages/list/index.wxml -->
<import src="/templates/page-loading.wxml" />
<import src="/templates/load-error.wxml" />

<template is="pageLoading" data="{{loading, loadProgress}}" />
<template is="loadError" data="{{loadError}}" />

<!-- 正常内容，loadError 时隐藏 -->
<view class="content" wx:if="{{!loadError}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</view>
```

#### 类型3：音频页面（使用组合 Behavior）

```js
// pages/audio/index.js
const api = getApp().api
const audioApi = getApp().audioApi
const pageGuard = require('../../behaviors/pageGuard')
const audioPageLoading = require('../../behaviors/audioPageLoading')

Page({
  behaviors: [pageGuard.behavior, audioPageLoading],
  data: {},

  onLoad(options) {
    this.startAudioPageLoading()  // 同时启动进度条和音频遮罩
    this.loadData(options)
  },

  loadData(options) {
    api.request(this, '/api/audio', options, true).then(res => {
      this.setData({ detail: res })
      // 加载音频，实时更新进度
      return audioApi.initAudio(res.audioUrl, (progress) => {
        this.updateAudioProgress(progress)
      })
    }).then(() => {
      this.setDataReady()
      this.finishAudioPageLoading()  // 同时结束进度条和遮罩
    }).catch(() => {
      pageGuard.goBack(this)
    })
  }
})
```

```xml
<!-- pages/audio/index.wxml -->
<import src="/templates/page-loading.wxml" />
<import src="/templates/audio-loading.wxml" />

<template is="pageLoading" data="{{loading, loadProgress}}" />
<template is="audioLoading" data="{{audioDownProgress}}" />

<view class="content">
  <!-- 音频页面内容 -->
</view>
```

#### 类型4：简单表单页（无初始化加载）

```js
// pages/form/index.js
const api = getApp().api

Page({
  data: {},

  // 策略C：用户操作，失败仅提示
  submit(e) {
    const data = e.detail.value
    api.request(this, '/api/save', data, true, 'POST').then(() => {
      api.toast('保存成功')
      wx.navigateBack()
    }).catch(() => {
      // 错误已在 api.js 中 toast，无需额外处理
    })
  }
})
```

### 4.3 API 方法速查表

#### pageGuard 实例方法（通过 this 调用）

| 方法 | 说明 | 示例 |
|------|------|------|
| `this.registerTimer(name, fn, delay)` | 注册安全定时器 | `this.registerTimer('auto', () => {}, 3000)` |
| `this.cancelTimer(name)` | 取消定时器 | `this.cancelTimer('auto')` |
| `this.setDataReady()` | 标记数据就绪 | 数据加载完成后调用 |
| `this.isDataReady()` | 检查数据是否就绪 | `if (this.isDataReady()) {...}` |
| `this.navigateTo(url, options)` | 安全跳转 | `this.navigateTo('/pages/x/index')` |
| `this.redirectTo(url)` | 安全重定向 | `this.redirectTo('/pages/x/index')` |
| `this.navigateBack(delta)` | 安全返回 | `this.navigateBack()` |
| `this.switchTab(url)` | 安全切换 Tab | `this.switchTab('/pages/home/index')` |
| `this.throttleAction(name, fn, delay)` | 节流操作 | `this.throttleAction('submit', () => {})` |

#### pageGuard 静态方法（通过模块调用）

| 方法 | 说明 | 适用场景 |
|------|------|----------|
| `pageGuard.goBack(this)` | 结束加载 → 1.5秒后退回 | 详情页加载失败 |
| `pageGuard.showRetry(this)` | 结束加载 → 显示重试按钮 | 列表页加载失败 |
| `pageGuard.finishProgress(this)` | 仅结束加载状态 | 非关键数据失败 |

#### pageLoading 方法

| 方法 | 说明 |
|------|------|
| `this.startLoading()` | 开始显示进度条 |
| `this.finishLoading()` | 结束进度条（100% 后隐藏） |

#### audioLoading 方法

| 方法 | 说明 |
|------|------|
| `this.startAudioLoading()` | 开始显示音频遮罩（进度归零） |
| `this.updateAudioProgress(progress)` | 更新进度 (0-100) |
| `this.finishAudioLoading()` | 结束音频遮罩（进度设为100） |

#### loadError 方法

| 方法 | 说明 |
|------|------|
| `this.showLoadError()` | 显示加载失败状态 |
| `this.hideLoadError()` | 隐藏加载失败状态 |

---

## 五、错误处理策略

### 5.1 五种策略对照表

| 策略 | 名称 | 代码 | 适用场景 |
|------|------|------|----------|
| **A** | 退回 | `pageGuard.goBack(this)` | 详情页、子页面加载失败 |
| **B** | 重试 | `pageGuard.showRetry(this)` | 首页、列表页加载失败 |
| **C** | 提示 | `.catch(() => {})` | 用户操作失败（api.js 自动 toast） |
| **D** | 静默 | `.catch(() => {})` | 自动保存、埋点、后台操作 |
| **E** | 结束 | `pageGuard.finishProgress(this)` | 非关键辅助数据加载失败 |

### 5.2 按页面类型选择

| 页面类型 | 初始化加载 | 用户操作 | 后台操作 |
|----------|:----------:|:--------:|:--------:|
| 首页 | B 重试 | C 提示 | D 静默 |
| 列表页 | B 重试 | C 提示 | D 静默 |
| 详情页 | A 退回 | C 提示 | D 静默 |
| 设置页 | A 退回 | C 提示+恢复 | D 静默 |
| 训练页 | A 退回 | D 静默 | D 静默 |
| 表单页 | - | C 提示 | - |

### 5.3 策略实现代码

```js
// 策略A：退回
.catch(() => {
  pageGuard.goBack(this)
})

// 策略B：重试（需配合 loadError behavior）
listData() {
  this.hideLoadError()
  api.request(...).then(() => {
    this.finishLoading()
  }).catch(() => {
    pageGuard.showRetry(this)
  })
},
retryLoad() {
  this.startLoading()
  this.listData()
}

// 策略C：仅提示（错误已在 api.js toast）
.catch(() => {
  // 无需处理
})

// 策略D：静默失败
.catch(() => {
  // 静默
})

// 策略E：仅结束进度
.catch(() => {
  pageGuard.finishProgress(this)
})

// 策略C + 恢复状态
onToggle(e) {
  const newVal = e.detail.value
  const oldVal = this.data.item.value
  this.setData({ 'item.value': newVal })
  api.request(...).catch(() => {
    this.setData({ 'item.value': oldVal })  // 恢复
  })
}
```

---

## 六、迁移到其他项目

### 6.1 Step 1：复制文件

将以下文件复制到目标项目：

```
behaviors/
├── pageGuard.js           # 必须
├── pageLoading.js         # 必须
├── audioLoading.js        # 可选（有音频页面才需要）
├── audioPageLoading.js    # 可选（有音频页面才需要）
└── loadError.js           # 可选（有重试功能才需要）

templates/
├── page-loading.wxml      # 必须
├── audio-loading.wxml     # 可选
└── load-error.wxml        # 可选

style/
├── page-loading.wxss      # 必须
├── audio-loading.wxss     # 可选
└── load-error.wxss        # 可选
```

### 6.2 Step 2：配置 app.wxss

```css
/* app.wxss */
@import "style/page-loading.wxss";
@import "style/audio-loading.wxss";   /* 可选 */
@import "style/load-error.wxss";      /* 可选 */

/* 可自定义主题色 */
page {
  --theme-color: #007bff;
}
```

### 6.3 Step 3：配置 app.js（可选）

```js
// app.js
const pageGuard = require('./behaviors/pageGuard.js')

App({
  pageGuard: pageGuard,  // 全局访问（可选）
  // ...
})
```

### 6.4 Step 4：配置 api.js

确保 api.js 中的 request 方法符合以下要求：

```js
// utils/api.js
function request(that, url, data, hasToast, method = 'GET') {
  return new Promise((resolve, reject) => {
    let timer = null

    // 超过1秒显示 loading（兜底）
    if (!hasToast) {
      timer = setTimeout(() => {
        wx.showLoading({ title: '努力加载中...' })
      }, 1000)
    }

    wx.request({
      url: BASE_URL + url,
      data: data,
      method: method,
      header: { /* ... */ },
      success(res) {
        clearTimeout(timer)
        wx.hideLoading()

        if (res.data.code == '200') {
          // 成功时将数据 setData 到页面
          if (res.data.data && that.setData) {
            that.setData(res.data.data)
          }
          resolve(res.data.data)
        } else {
          // 业务错误：toast 并 reject
          wx.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail(err) {
        clearTimeout(timer)
        wx.hideLoading()
        // 网络错误：toast 并 reject
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = { request, /* ... */ }
```

**关键点：**
- `hasToast=true` 时跳过全局 loading（页面已有进度条）
- 错误时自动 toast 并 reject（配合策略C）
- 成功时自动 setData（可选）

### 6.5 Step 5：逐页面接入

按以下顺序为每个页面接入：

1. **引入 behaviors**
```js
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')
// 按需引入
const loadError = require('../../behaviors/loadError')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  // ...
})
```

2. **引入 templates**
```xml
<import src="/templates/page-loading.wxml" />
<import src="/templates/load-error.wxml" />

<template is="pageLoading" data="{{loading, loadProgress}}" />
<template is="loadError" data="{{loadError}}" />
```

3. **添加生命周期调用**
```js
onLoad() {
  this.startLoading()
  this.loadData()
}
```

4. **选择错误处理策略**
```js
loadData() {
  this.hideLoadError()  // 仅策略B需要
  api.request(this, '/api/xxx', {}, true).then(res => {
    this.setDataReady()
    this.finishLoading()
  }).catch(() => {
    pageGuard.showRetry(this)  // 或 goBack / finishProgress
  })
}
```

5. **实现重试方法**（仅策略B需要）
```js
retryLoad() {
  this.startLoading()
  this.loadData()
}
```

---

## 七、常见问题

### Q1：进度条卡在 90% 不动

**原因**：`.catch()` 中没有调用 `finishLoading()`

**解决**：
```js
.catch(() => {
  this.finishLoading()  // 必须调用
  // 或使用 pageGuard 方法，它们内部会自动调用
  pageGuard.goBack(this)
})
```

### Q2：控制台报 "Uncaught (in promise)" 错误

**原因**：`api.request()` 没有 `.catch()` 处理

**解决**：每个 `api.request()` 都必须有 `.catch()`，即使是空的：
```js
api.request(...).catch(() => {
  // 静默失败也要写 catch
})
```

### Q3：页面跳转时定时器仍在执行

**原因**：使用了原生 `setTimeout` 而非 `registerTimer`

**解决**：
```js
// 错误 ❌
setTimeout(() => { /* ... */ }, 1000)

// 正确 ✅
this.registerTimer('myTimer', () => { /* ... */ }, 1000)
```

### Q4：快速点击导致多次跳转

**原因**：使用了原生 `wx.navigateTo`

**解决**：
```js
// 错误 ❌
wx.navigateTo({ url: '/pages/xxx' })

// 正确 ✅
this.navigateTo('/pages/xxx')
```

### Q5：pageGuard is not a Behavior

**原因**：直接使用 `pageGuard` 而非 `pageGuard.behavior`

**解决**：
```js
// 错误 ❌
behaviors: [pageGuard, pageLoading]

// 正确 ✅
behaviors: [pageGuard.behavior, pageLoading]
```

### Q6：音频遮罩不显示

**原因**：`audioDownProgress` 默认值是 100（表示已加载完成）

**解决**：确保先调用 `startAudioLoading()` 将进度重置为 0：
```js
this.startAudioLoading()  // 进度归零，显示遮罩
// 加载音频...
this.finishAudioLoading() // 进度设为100，隐藏遮罩
```

### Q7：重试按钮点击无反应

**原因**：页面没有实现 `retryLoad` 方法

**解决**：
```js
// 必须实现此方法
retryLoad() {
  this.startLoading()
  this.loadData()  // 重新加载数据
}
```

### Q8：样式不生效

**原因**：没有在 app.wxss 中引入样式文件

**解决**：
```css
/* app.wxss */
@import "style/page-loading.wxss";
@import "style/load-error.wxss";
```

---

## 八、迁移检查清单

### 8.1 文件检查

- [ ] `behaviors/pageGuard.js` 已复制
- [ ] `behaviors/pageLoading.js` 已复制
- [ ] `behaviors/loadError.js` 已复制（如需重试功能）
- [ ] `behaviors/audioLoading.js` 已复制（如有音频页面）
- [ ] `behaviors/audioPageLoading.js` 已复制（如有音频页面）
- [ ] `templates/page-loading.wxml` 已复制
- [ ] `templates/load-error.wxml` 已复制（如需重试功能）
- [ ] `templates/audio-loading.wxml` 已复制（如有音频页面）
- [ ] `style/page-loading.wxss` 已复制
- [ ] `style/load-error.wxss` 已复制（如需重试功能）
- [ ] `style/audio-loading.wxss` 已复制（如有音频页面）

### 8.2 配置检查

- [ ] `app.wxss` 已引入所有样式文件
- [ ] `api.js` 支持 `hasToast` 参数
- [ ] `api.js` 错误时会 `reject`

### 8.3 页面检查（每个页面）

- [ ] 使用 `pageGuard.behavior` 而非 `pageGuard`
- [ ] WXML 中引入了对应的模板
- [ ] `onLoad/onShow` 中调用了 `startLoading()`
- [ ] 成功时调用了 `finishLoading()` 和 `setDataReady()`
- [ ] 失败时有 `.catch()` 处理
- [ ] 使用策略B时实现了 `retryLoad()` 方法
- [ ] 导航使用 `this.navigateTo()` 而非 `wx.navigateTo()`

### 8.4 代码规范检查

- [ ] 每个 `api.request()` 都有 `.catch()` 处理
- [ ] 定时器使用 `registerTimer()` 而非 `setTimeout()`
- [ ] 错误处理策略选择正确（参考 5.2 表格）

---

## 九、骨架屏（可选扩展）

骨架屏用于在内容加载时显示占位轮廓，提升用户感知体验。

> 详细使用指南请参考：[骨架屏组件文档](./skeleton-guide.md)

### 9.1 快速使用

```xml
<!-- 骨架屏（loading 为 true 时显示） -->
<skeleton type="list" loading="{{loading}}" rows="5" avatar />

<!-- 正常内容（loading 为 false 时显示） -->
<view wx:if="{{!loading}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</view>
```

### 9.2 预设类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `list` | 列表骨架 | 通知列表、训练列表 |
| `card` | 卡片骨架 | 专辑卡片、课程卡片 |
| `detail` | 详情骨架 | 文章详情、通知详情 |
| `user` | 用户信息骨架 | 用户中心 |

### 9.3 与加载系统配合

```xml
<!-- 进度条 -->
<template is="pageLoading" data="{{loading, loadProgress}}" />

<!-- 骨架屏（loading 时显示，错误时隐藏） -->
<skeleton type="list" loading="{{loading}}" rows="5" wx:if="{{!loadError}}" />

<!-- 错误重试 -->
<template is="loadError" data="{{loadError}}" />

<!-- 正常内容 -->
<view wx:if="{{!loading && !loadError}}">...</view>
```

---

## 十、变更日志

### v4.2.0 (2025-12-10)

**新增功能：**
- 添加骨架屏组件 `components/skeleton`
- 添加骨架屏样式 `style/skeleton.wxss`
- 添加骨架屏文档 `docs/skeleton-guide.md`

### v4.1.0 (2025-12-10)

**完成迁移：**
- 所有页面已从 `errorHandler` 迁移到 `pageGuard.behavior`
- 不再使用 `getApp().errorHandler`

**文档更新：**
- 添加完整源码章节
- 添加详细迁移步骤
- 添加常见问题解答
- 添加迁移检查清单

### v4.0.0 (2025-12-10)

**重大变更：**
- 将 `utils/errorHandler.js` 合并到 `behaviors/pageGuard.js`
- `pageGuard` 现在导出一个对象：`{ behavior, goBack, showRetry, finishProgress }`

**新增功能：**
- 定时器安全管理：`registerTimer()` / `cancelTimer()`
- 导航锁：`navigateTo()` / `redirectTo()` / `navigateBack()` / `switchTab()`
- 节流方法：`throttleAction()`
- 数据就绪状态：`setDataReady()` / `isDataReady()`

---

**文档版本：** v4.2.0
**最后更新：** 2025-12-10
**维护者：** 开发团队
