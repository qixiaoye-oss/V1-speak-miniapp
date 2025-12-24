# Tag 公用样式指南

**版本**: 1.0.0
**文件**: `style/tag.wxss`
**更新日期**: 2025-12-21

## 概述

通用标签样式组件，用于列表页、卡片等多处场景的标签展示。支持静态颜色、动态颜色和多段标签。

## 依赖

需要在 `app.wxss` 中定义以下主色变量：

```css
page {
  --main-gray-color: rgba(0, 0, 0, 0.3);
  --main-green-color: #00D26A;
  --main-blue-color: #00A6ED;
  --main-red-color: #F92F60;
  --main-orange-color: #FFB02E;
}
```

## 引入方式

在 `app.wxss` 中引入：

```css
@import "style/tag.wxss";
```

---

## 样式类一览

### 基础类

| 类名 | 说明 |
|------|------|
| `.tag` | 基础样式（必须） |

### 静态颜色变体

| 类名 | 说明 | 效果 |
|------|------|------|
| `.tag--transparent` | 透明底 + 白字 | 用于深色背景 |
| `.tag--opaque` | 白底 | 用于浅色背景 |
| `.tag--red` | 红色实底 + 白字 | 重点/警告 |
| `.tag--orange` | 橙色实底 + 白字 | 权限/付费 |
| `.tag--green` | 绿色实底 + 白字 | 体验/免费 |

### 动态颜色变体

通过 CSS 变量 `--tag-color` 传递颜色值：

| 类名 | 说明 |
|------|------|
| `.tag--dynamic-outline` | 描边样式（透明底 + 边框 + 文字同色） |
| `.tag--dynamic-solid` | 实底样式（背景色 + 白字） |
| `.tag--dynamic-translucent` | 半透明底（15%背景 + 文字同色） |

### Multi 变体（多段标签）

| 类名 | 说明 |
|------|------|
| `.tag__multi` | 多段容器（与 `.tag` 一起使用） |
| `.tag__multi--red` | 红色半透明底 |
| `.tag__multi--orange` | 橙色半透明底 |
| `.tag__multi--green` | 绿色半透明底 |
| `.tag__multi--gray` | 灰色边框 + 白底 |
| `.tag__intervals` | 分隔线（用于 multi 内部） |

### 工具类

| 类名 | 说明 |
|------|------|
| `.tag--right` | 右对齐（margin-left: auto） |

---

## 使用示例

### 1. 静态颜色标签

```html
<!-- 红色实底 -->
<view class="tag tag--red">重点</view>

<!-- 橙色实底 -->
<view class="tag tag--orange">权限</view>

<!-- 绿色实底 -->
<view class="tag tag--green">体验</view>
```

### 2. 动态颜色标签

通过 `style` 传递 CSS 变量：

```html
<!-- 描边样式 -->
<view class="tag tag--dynamic-outline" style="--tag-color:{{colorRgb}}">
  {{count}}
</view>

<!-- 实底样式 -->
<view class="tag tag--dynamic-solid" style="--tag-color:{{colorRgb}}">
  {{description}}
</view>

<!-- 半透明底 -->
<view class="tag tag--dynamic-translucent" style="--tag-color:{{colorRgb}};--tag-color-bg:{{colorRgba}}">
  {{text}}
</view>
```

### 3. Multi 多段标签（进度标签）

```html
<!-- 灰色（未开始） -->
<view class="tag tag__multi tag__multi--gray">
  <view>P1</view>
  <view class="tag__intervals"></view>
  <view>0/10</view>
</view>

<!-- 橙色（进行中） -->
<view class="tag tag__multi tag__multi--orange">
  <view>P1</view>
  <view class="tag__intervals"></view>
  <view>5/10</view>
</view>

<!-- 绿色（已完成） -->
<view class="tag tag__multi tag__multi--green">
  <view>P1</view>
  <view class="tag__intervals"></view>
  <view>10/10</view>
</view>
```

### 4. 右对齐标签

```html
<view class="footer" style="display:flex;">
  <view class="tag tag--green">体验</view>
  <view class="tag tag__multi tag__multi--orange tag--right">
    <view>进度</view>
    <view class="tag__intervals"></view>
    <view>5/10</view>
  </view>
</view>
```

---

## 样式参数

| 属性 | 值 |
|------|-----|
| padding | 5px |
| line-height | 1 |
| border-radius | 3px |
| font-size | 12px |
| gap (multi) | 5px |
| intervals height | 12px |

---

## 注意事项

1. **必须使用基础类**: 所有标签必须包含 `.tag` 基础类
2. **动态颜色**: 使用 `--tag-color` CSS 变量传递颜色值，支持 rgba/hex 格式
3. **Multi 标签**: 需要同时使用 `.tag`、`.tag__multi` 和颜色变体类
4. **主色依赖**: 静态颜色变体依赖主色变量，需确保已在 app.wxss 中定义

---

## 更新日志

### v1.0.0 (2025-12-21)
- 初始版本
- 支持静态颜色变体：transparent, opaque, red, orange, green
- 支持动态颜色变体：dynamic-outline, dynamic-solid, dynamic-translucent
- 支持 multi 多段标签：red, orange, green, gray
- 支持分隔线和工具类
