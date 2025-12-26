# 按钮组样式规范

> 本文档说明底部按钮组的样式规范、布局模式和使用指南。

**版本**: 1.0.0
**文件**: `style/button-group.wxss`
**更新日期**: 2025-12-26

## 概述

纯 CSS 实现的底部固定按钮容器，支持多种布局模式和遮罩功能。

## 核心特性

- 纯 CSS 实现，无需 JS 配合
- 自动图标颜色映射
- 动态高度计算
- 多种布局模式

## 布局模式

### 单层布局
- 高度：102px
- 适用：单行按钮

### 双层/分割布局
- 高度：168px
- 适用：双行按钮或提示 + 按钮

## 主要元素

| 元素 | 说明 |
|------|------|
| `.button-group` | 容器 |
| `.button-group__layer` | 按钮层 |
| `.button-group__hint` | 提示横幅 |
| `.button-group__mark` | 角标 |

## 使用示例

### 单层按钮

```xml
<view class="button-group button-group--single">
  <view class="button-group__layer">
    <tap-action type="button" icon="play">
      <view class="btn btn--primary">播放</view>
    </tap-action>
  </view>
</view>
```

### 双层按钮

```xml
<view class="button-group button-group--split">
  <view class="button-group__hint">提示信息</view>
  <view class="button-group__layer">
    <tap-action type="button" icon="save">
      <view class="btn btn--secondary">保存</view>
    </tap-action>
    <tap-action type="button" icon="next">
      <view class="btn btn--primary">下一步</view>
    </tap-action>
  </view>
</view>
```

## 图标颜色映射

| 图标 | 主色 | 背景色 |
|------|------|--------|
| save, play | #00A6ED | rgba(0,166,237,0.15) |
| correct | #00D26A | rgba(0,210,106,0.15) |
| delete | #F92F60 | rgba(249,47,96,0.15) |
| next | #FFB02E | rgba(255,176,46,0.15) |

## 位置类

| 类名 | 效果 |
|------|------|
| `.btn--left` | 左对齐 |
| `.btn--right` | 右对齐 |
| `.btn--center` | 居中 |

## 注意事项

1. 按钮组固定在页面底部
2. 需要为页面内容预留底部空间
3. 使用 CSS 变量控制高度

---

*文档版本：v1.0*
*创建日期：2025-12-26*
*适用项目：V1-speak-miniapp*
