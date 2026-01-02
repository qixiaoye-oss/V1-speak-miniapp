# 骨架屏与内容互斥显示规范

> 本文档说明如何正确处理骨架屏与页面内容的互斥显示，避免出现两者同时显示的闪烁问题。

## 1. 问题描述

### 1.1 错误做法

使用 `loading` 变量同时控制骨架屏和内容：

```xml
<!-- ❌ 错误：可能导致骨架屏与内容同时显示 -->
<skeleton type="detail" loading="{{loading}}" />
<view wx:if="{{!loading}}">内容</view>
```

**问题原因**：
- `loading` 由 `finishLoading()` 设为 `false`
- 内容数据由 `setData()` 设置
- 如果 `finishLoading()` 在 `setData()` 之前执行，会出现：
  - `loading = false` → 骨架屏隐藏
  - 数据尚未就绪 → 内容为空或不完整
  - 短暂闪烁后数据到达 → 内容显示

### 1.2 正确做法

使用 `_isDataReady` 变量实现真正的互斥：

```xml
<!-- ✅ 正确：骨架屏与内容严格互斥 -->
<skeleton type="detail" loading="{{!_isDataReady}}" />
<view wx:if="{{_isDataReady}}">内容</view>
```

## 2. 实现原理

### 2.1 变量说明

| 变量 | 来源 | 含义 |
|------|------|------|
| `loading` | `pageLoading` behavior | 进度条是否显示 |
| `_isDataReady` | `pageGuard` behavior | 数据是否已加载完成 |

### 2.2 状态时序

```
时间 →
├── startLoading()     → loading = true
├── API 请求中...
├── setData(res)       → 数据写入
├── setDataReady()     → _isDataReady = true  ← 内容显示
├── finishLoading()    → loading = false
```

**关键点**：`setDataReady()` 必须在 `setData()` 之后调用，确保数据已就绪。

## 3. 标准实现模式

### 3.1 JS 文件

```javascript
const pageLoading = require('../../behaviors/pageLoading')
const pageGuard = require('../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior, pageLoading],

  onLoad() {
    this.startLoading()
    this.loadData()
  },

  loadData() {
    api.request(this, '/api/xxx', {}, true, 'GET', false)
      .then((res) => {
        // 1. 先设置数据
        this.setData(res)
        // 2. 再标记数据就绪（触发内容显示、骨架屏隐藏）
        this.setDataReady()
      })
      .finally(() => {
        // 3. 最后结束进度条
        this.finishLoading()
      })
  }
})
```

### 3.2 WXML 文件

```xml
<import src="/templates/page-loading.wxml" />
<template is="pageLoading" data="{{loading, loadProgress}}" />

<!-- 骨架屏：与内容互斥显示 -->
<skeleton type="detail" loading="{{!_isDataReady}}" rows="{{3}}" />

<!-- 内容：数据就绪后显示 -->
<view class="page-content" wx:if="{{_isDataReady}}">
  <!-- 实际内容 -->
</view>
```

## 4. 配合 smartLoading + diffSetData

对于使用静默刷新的页面，此模式同样适用且不影响功能：

```javascript
const smartLoading = require('../../behaviors/smartLoading')
const { diffSetData } = require('../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, smartLoading],

  onShow() {
    const isFirstLoad = !this.data._hasLoaded

    if (!isFirstLoad && this.isFromBackground()) {
      return
    }

    if (isFirstLoad) {
      // 首次加载：显示进度条
      this.startLoading()
      this.loadData(true)
    } else {
      // 静默刷新：不显示进度条
      this.loadData(false)
    }
  },

  loadData(showLoading) {
    const hasToast = !showLoading
    api.request(this, '/api/xxx', {}, hasToast, 'GET', false)
      .then((res) => {
        // 使用 diff 更新，只更新变化的字段
        diffSetData(this, res)
        this.markLoaded()
        this.setDataReady()
      })
      .finally(() => {
        this.finishLoading()
      })
  }
})
```

**为什么不影响静默刷新**：
- `_isDataReady` 只在首次加载时从 `false` 变为 `true`
- 静默刷新时 `_isDataReady` 已经是 `true`，骨架屏不会再显示
- `diffSetData` 只更新变化的数据字段，不影响 `_isDataReady`

## 5. 各页面配置参考

| 页面 | 骨架屏条件 | 内容条件 |
|------|-----------|---------|
| `science/detail` | `{{!_isDataReady}}` | `{{_isDataReady}}` |
| `question-p1-detail` | `{{!_isDataReady}}` | `{{_isDataReady}}` |
| `question-p2-detail` | `{{!_isDataReady}}` | `{{_isDataReady}}` |
| `question-p3-detail` | `{{!_isDataReady}}` | `{{_isDataReady}}` |

## 6. 检查清单

在实现骨架屏时，确保：

- [ ] 骨架屏使用 `loading="{{!_isDataReady}}"` 而非 `loading="{{loading}}"`
- [ ] 内容区使用 `wx:if="{{_isDataReady}}"` 而非 `wx:if="{{!loading}}"`
- [ ] JS 中调用顺序：`setData()` → `setDataReady()` → `finishLoading()`
- [ ] 页面引入了 `pageGuard.behavior`（提供 `setDataReady` 方法）

## 7. 常见问题

### Q: 为什么不直接用 `loading` 控制？

A: `loading` 控制的是进度条动画，与数据状态无关。`finishLoading()` 可能在数据到达前被调用（如在 finally 中），导致骨架屏提前隐藏。

### Q: `_isDataReady` 会被重置吗？

A: 不会。`setDataReady()` 只会将其设为 `true`，没有重置方法。这符合"数据一旦就绪就保持显示"的设计。

### Q: 静默刷新时会闪烁吗？

A: 不会。静默刷新时 `_isDataReady` 已经是 `true`，骨架屏条件 `!_isDataReady` 为 `false`，骨架屏不显示。

---

*文档版本：v1.0*
*创建日期：2025-01-02*
*适用项目：V1-speak-miniapp*
