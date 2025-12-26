# 骨架屏策划方案

> 本文档说明骨架屏组件的设计、实现和使用指南。

## 1. 项目现状分析

### 1.1 当前加载机制
当前项目使用进度条 + 骨架屏的加载机制：
- 进度条模板：`/templates/page-loading.wxml`
- 骨架屏组件：`/components/skeleton/skeleton`
- 实现方式：顶部进度条动画 + 内容区骨架屏

### 1.2 页面结构分类

| 页面类型 | 页面路径 | 布局特点 |
|---------|----------|---------|
| **首页** | `pages/home/home` | 卡片网格 + 分组列表 |
| **题目列表** | `pages/question/set-p1-list` | 带图标的条目列表 |
| **题目详情** | `pages/question/question-p1-detail` | 详情内容布局 |
| **科普列表** | `pages/science/list` | 条目列表 |
| **科普详情** | `pages/science/detail` | 文章详情布局 |
| **用户页** | `pages/user/user` | 头像信息 + 菜单列表 |

## 2. 骨架屏类型设计

基于页面布局分析，设计以下 **5 种骨架屏类型**：

### 2.1 `list` - 通用列表型
**适用页面**：题目列表、科普列表等
**布局结构**：
```
┌─────────────────────────────────┐
│ [■■■] ████████████████  [tag] │
├─────────────────────────────────┤
│ [■■■] ████████████████  [tag] │
├─────────────────────────────────┤
│ [■■■] ████████████████  [tag] │
└─────────────────────────────────┘
```
**属性配置**：
- `avatar: true` - 显示左侧图标占位
- `rows: 5` - 默认5行

### 2.2 `card` - 卡片网格型
**适用页面**：首页
**布局结构**：
```
┌──────────┐  ┌──────────┐
│  ████    │  │  ████    │
│ ████████ │  │ ████████ │
│  [tag]   │  │  [tag]   │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│  ████    │  │  ████    │
│ ████████ │  │ ████████ │
│  [tag]   │  │  [tag]   │
└──────────┘  └──────────┘
```
**属性配置**：
- `rows: 6` - 默认6个卡片

### 2.3 `detail` - 详情内容型
**适用页面**：题目详情、科普详情
**属性配置**：
- `rows: 3` - 内容段落数

### 2.4 `sentence` - 句子列表型
**适用页面**：句子列表、单词列表
**属性配置**：
- `rows: 5` - 句子条目数
- `showActions: true` - 显示操作按钮占位

### 2.5 `user` - 用户信息型
**适用页面**：用户中心
**属性配置**：
- `rows: 4` - 菜单项数量

## 3. 组件设计规范

### 3.1 文件结构
```
/components/skeleton/
├── skeleton.wxml      # 组件模板
├── skeleton.wxss      # 组件基础样式
├── skeleton.js        # 组件逻辑
└── skeleton.json      # 组件配置

/style/
└── skeleton.wxss      # 全局骨架屏样式（含动画）
```

### 3.2 组件属性定义

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loading` | Boolean | `true` | 控制骨架屏显示/隐藏 |
| `type` | String | `'list'` | 骨架屏类型 |
| `rows` | Number | `5` | 骨架行数（推荐3-8） |
| `animate` | Boolean | `true` | 是否启用闪烁动画 |
| `avatar` | Boolean | `false` | 是否显示头像占位 |
| `avatarShape` | String | `'square'` | 头像形状 |
| `showActions` | Boolean | `true` | 是否显示操作按钮占位 |
| `title` | String | `''` | 骨架屏标题 |
| `customClass` | String | `''` | 自定义类名 |

### 3.3 CSS 变量支持

```css
page {
  --skeleton-bg: #f0f0f0;
  --skeleton-highlight: #e8e8e8;
  --skeleton-radius: 6px;
  --skeleton-card-bg: #fff;
  --skeleton-border-color: #eee;
  --skeleton-item-gap: 15px;
}
```

## 4. 页面接入方案

### 4.1 组件注册

**页面 json 中注册**：
```json
{
  "usingComponents": {
    "skeleton": "/components/skeleton/skeleton"
  }
}
```

### 4.2 使用示例

**首页（卡片网格）**：
```xml
<skeleton type="card" loading="{{loading}}" rows="{{6}}" />
```

**列表页**：
```xml
<skeleton type="list" loading="{{loading}}" rows="{{5}}" avatar="{{true}}" />
```

**详情页**：
```xml
<skeleton type="detail" loading="{{loading}}" rows="{{3}}" />
```

### 4.3 与进度条配合

```xml
<template is="pageLoading" data="{{loading, loadProgress}}" />
<skeleton type="list" loading="{{loading}}" rows="{{5}}" />
<view wx:if="{{!loading}}">
  <!-- 实际内容 -->
</view>
```

## 5. 各页面配置参数

| 页面 | type | rows | avatar |
|------|------|------|--------|
| home | card | 6 | - |
| set-p1-list | list | 5 | true |
| question-p1-list | list | 5 | - |
| science/list | list | 5 | - |
| user | user | 4 | - |
| detail | detail | 3 | - |

## 6. 注意事项

### 6.1 性能建议
- 大列表（rows > 8）建议禁用动画
- 骨架屏行数建议 3-8 行
- 动画使用 CSS 实现

### 6.2 Flex/Grid 间距问题

组件已启用 `virtualHost: true`，解决间距问题：

```javascript
Component({
  options: {
    virtualHost: true
  }
})
```

## 7. 跨项目复用

需要复制的文件：
```
├── /components/skeleton/
└── /style/skeleton.wxss
```

---

*文档版本：v1.0*
*创建日期：2025-12-26*
*适用项目：V1-speak-miniapp*
