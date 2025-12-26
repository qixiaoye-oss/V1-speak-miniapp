# 加载状态管理指南

> 本文档说明统一的加载状态管理系统，涵盖加载动画、错误处理策略、页面安全守卫和复用指南。

## 系统架构

加载状态管理系统分为四层：

```
┌─────────────────────────────────────────────────┐
│  视觉反馈层 (Visual Feedback)                    │
│  - pageLoading: 顶部进度条                       │
│  - audioLoading: 圆形进度条（音频页面）           │
│  - skeleton: 骨架屏                             │
├─────────────────────────────────────────────────┤
│  全局 API 兜底                                   │
│  - 请求超时自动显示原生 loading                   │
├─────────────────────────────────────────────────┤
│  页面守卫层 (Page Guard)                         │
│  - 定时器安全管理                                │
│  - 导航锁                                       │
│  - 数据就绪状态                                  │
│  - 错误处理策略                                  │
├─────────────────────────────────────────────────┤
│  失败 UI 层                                      │
│  - 重试按钮                                      │
│  - 错误提示                                      │
└─────────────────────────────────────────────────┘
```

## 核心文件

### 必需文件

| 文件路径 | 说明 |
|---------|------|
| `behaviors/pageGuard.js` | 页面守卫核心 Behavior |
| `behaviors/pageLoading.js` | 页面进度条 Behavior |
| `behaviors/loadError.js` | 加载失败重试 Behavior |
| `templates/page-loading.wxml` | 进度条模板 |
| `templates/load-error.wxml` | 错误重试模板 |
| `style/page-loading.wxss` | 进度条样式 |
| `style/load-error.wxss` | 错误重试样式 |

### 模块关系

```
pageGuard.behavior (核心基础)
    ├── pageLoading (进度条)
    ├── loadError (错误重试)
    └── audioLoading (音频进度，可选)
```

**重要**：引入时使用 `pageGuard.behavior` 而非直接使用 `pageGuard`。

## 使用方式

### 页面 JS 结构

```javascript
const api = getApp().api
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const pageGuard = require('../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],

  data: {
    // 页面数据
  },

  // 登录后自动调用
  onShowLogin() {
    this.startLoading()
    this.hideLoadError()

    this.loadData()
      .then(() => {
        this.setDataReady()
      })
      .catch(() => {
        pageGuard.showRetry(this)
      })
      .finally(() => {
        this.finishLoading()
      })
  },

  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()

    this.loadData()
      .then(() => {
        this.setDataReady()
      })
      .catch(() => {
        pageGuard.showRetry(this)
      })
      .finally(() => {
        this.finishLoading()
      })
  },

  // 数据加载
  loadData() {
    return api.request(this, '/api/data', {})
  }
})
```

### 页面 WXML 结构

```xml
<import src="/templates/page-loading.wxml"/>
<import src="/templates/load-error.wxml"/>
<template is="pageLoading" data="{{loading, loadProgress}}"/>
<template is="loadError" data="{{loadError}}"/>

<!-- 骨架屏 -->
<skeleton type="list" loading="{{loading}}" rows="{{5}}" />

<!-- 实际内容 -->
<view wx:if="{{!loading && !loadError}}">
  <!-- 页面内容 -->
</view>
```

## 错误处理策略

### 五种错误策略

| 策略 | 代码 | 适用场景 | 行为 |
|------|------|---------|------|
| A | `goBack` | 详情页加载失败 | 显示 Toast 后自动返回 |
| B | `showRetry` | 列表页/首页失败 | 显示重试按钮 |
| C | `toast` | 用户操作失败 | 显示 Toast 提示 |
| D | `silent` | 后台任务失败 | 静默处理 |
| E | `finishProgress` | 非关键数据失败 | 仅结束进度条 |

### 策略选择指南

```
页面类型判断：
├── 详情页 → 策略 A (goBack)
├── 列表页/首页 → 策略 B (showRetry)
├── 用户操作 → 策略 C (toast)
├── 后台任务 → 策略 D (silent)
└── 非关键数据 → 策略 E (finishProgress)
```

### 策略使用示例

```javascript
// 策略 A: 详情页失败自动返回
loadDetail() {
  api.request(this, '/api/detail', {})
    .then(() => this.setDataReady())
    .catch(() => pageGuard.goBack(this))
    .finally(() => this.finishLoading())
}

// 策略 B: 列表页失败显示重试
loadList() {
  api.request(this, '/api/list', {})
    .then(() => this.setDataReady())
    .catch(() => pageGuard.showRetry(this))
    .finally(() => this.finishLoading())
}

// 策略 E: 非关键数据失败仅结束进度
loadOptionalData() {
  api.request(this, '/api/optional', {})
    .catch(() => pageGuard.finishProgress(this))
}
```

## 页面守卫功能

### 定时器安全管理

```javascript
// ✅ 推荐：使用 registerTimer
this.registerTimer('myTimer', () => {
  // 回调逻辑
}, 1000)

// ❌ 避免：直接使用 setTimeout
setTimeout(() => {
  // 可能在页面销毁后执行
}, 1000)
```

### 安全导航

```javascript
// ✅ 推荐：使用 this.navigateTo
this.navigateTo('/pages/detail/index?id=1')

// ❌ 避免：直接使用 wx.navigateTo
wx.navigateTo({ url: '/pages/detail/index?id=1' })
```

### 数据就绪状态

```javascript
// 标记数据已就绪
this.setDataReady()

// 检查数据是否就绪
if (this.isDataReady()) {
  // 执行需要数据的操作
}
```

### 节流操作

```javascript
// 防止重复点击
this.throttleAction('submit', () => {
  // 提交逻辑
}, 1000)
```

## 进度条 API

### pageLoading Behavior

| 方法 | 说明 |
|------|------|
| `startLoading()` | 开始加载，显示进度条 |
| `finishLoading()` | 完成加载，隐藏进度条 |

### 进度条原理

```javascript
// 模拟进度：0% → 90%（递减增量）
simulateProgress() {
  // progress 从 0 缓慢增长到 90
  // 使用递减增量：越接近 90%，增长越慢
  const increment = Math.max(1, (90 - progress) / 10)
}

// 完成时：90% → 100%（快速完成）
finishLoading() {
  // 立即设置为 100%
  // 延迟 300ms 后隐藏
}
```

## 迁移检查清单

### 必须完成

- [ ] 引入三个 Behavior：`pageGuard.behavior`、`pageLoading`、`loadError`
- [ ] 在 WXML 中引入 `page-loading.wxml` 和 `load-error.wxml` 模板
- [ ] 实现 `onShowLogin()` 生命周期
- [ ] 实现 `retryLoad()` 重试方法
- [ ] 选择并应用合适的错误处理策略

### 可选配置

- [ ] 添加骨架屏组件
- [ ] 配置音频加载进度（音频页面）
- [ ] 使用 `registerTimer` 替换 `setTimeout`
- [ ] 使用 `this.navigateTo` 替换 `wx.navigateTo`

## 常见问题

### Q1: 为什么使用 `pageGuard.behavior` 而非 `pageGuard`？

`pageGuard` 模块导出的是一个对象，包含 `behavior` 和静态方法：

```javascript
module.exports = {
  behavior: behavior,  // Behavior 对象
  goBack: goBack,      // 静态方法
  showRetry: showRetry,
  finishProgress: finishProgress,
  isNavigating: checkIsNavigating
}
```

### Q2: 进度条为什么只增长到 90%？

这是常见的 UX 模式。真实的网络请求时间不可预测，让进度条在 90% 处减速等待，可以给用户"正在努力加载"的感觉，同时为真正的完成保留最后 10%。

### Q3: 什么时候使用骨架屏 vs 进度条？

- **进度条**：始终显示，提供加载反馈
- **骨架屏**：显示内容占位，让用户预知页面结构

两者应同时使用，不是二选一。

---

*文档版本：v1.0*
*创建日期：2025-12-26*
*适用项目：V1-speak-miniapp*
