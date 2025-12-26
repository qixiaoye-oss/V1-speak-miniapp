# Tag 公用样式指南

> 通用标签样式组件，用于列表页、卡片等多处场景的标签展示。

**版本**: 1.0.0
**文件**: `style/tag.wxss`
**更新日期**: 2025-12-26

## 概述

支持静态颜色、动态颜色和多段标签。

## 依赖

需要在 `app.wxss` 中定义以下主色变量：

```css
page {
  --main-gray-color: rgba(0, 0, 0, 0.3);
  --main-green-color: #00D26A;
  --main-blue-color: #00A6ED;
  --main-blue-color-bg: rgba(0, 166, 237, 0.15);
  --main-red-color: #F92F60;
  --main-orange-color: #FFB02E;
}
```

## 引入方式

在 `app.wxss` 中引入：

```css
@import "style/tag.wxss";
```

## 样式类一览

### 基础类

| 类名 | 说明 |
|------|------|
| `.tag` | 基础样式（必须） |

### 静态颜色变体

| 类名 | 效果 | 用途 |
|------|------|------|
| `.tag--transparent` | 透明底 + 白字 | 深色背景 |
| `.tag--opaque` | 白底 | 浅色背景 |
| `.tag--red` | 红色实底 + 白字 | 重点/警告 |
| `.tag--orange` | 橙色实底 + 白字 | 权限/付费 |
| `.tag--green` | 绿色实底 + 白字 | 体验/免费 |

### 动态颜色变体

| 类名 | 效果 |
|------|------|
| `.tag--dynamic-outline` | 描边样式，颜色由 `--tag-color` 控制 |
| `.tag--dynamic-solid` | 实底样式，颜色由 `--tag-color` 控制 |
| `.tag--dynamic-translucent` | 半透明底 |

### Multi 变体（多段标签）

| 类名 | 说明 |
|------|------|
| `.tag__multi` | 多段容器 |
| `.tag__multi--red` | 红色半透明底 |
| `.tag__multi--orange` | 橙色半透明底 |
| `.tag__multi--green` | 绿色半透明底 |
| `.tag__multi--blue` | 蓝色半透明底 |
| `.tag__multi--gray` | 灰色边框 + 白底 |
| `.tag__intervals` | 分隔线 |

### 工具类

| 类名 | 效果 |
|------|------|
| `.tag--right` | 右对齐（margin-left: auto） |

## 使用示例

### 静态颜色标签

```html
<view class="tag tag--green">免费</view>
<view class="tag tag--orange">VIP</view>
<view class="tag tag--red">热门</view>
```

### 动态颜色标签

```html
<!-- 描边样式 -->
<view class="tag tag--dynamic-outline" style="--tag-color: {{group.colorRgb}}">
  {{subject.childTotal}}
</view>

<!-- 实底样式 -->
<view class="tag tag--dynamic-solid" style="--tag-color: {{group.colorRgb}}">
  {{subject.description}}
</view>
```

### 多段标签

```html
<view class="tag tag__multi tag__multi--blue">
  <view>Part 1</view>
  <view class="tag__intervals"></view>
  <view>100题</view>
</view>
```

## 样式参数

| 属性 | 值 |
|------|-----|
| padding | 5px |
| line-height | 1 |
| border-radius | 3px |
| font-size | 12px |
| gap (multi) | 5px |
| intervals height | 12px |

## 注意事项

1. 所有标签必须包含 `.tag` 基础类
2. 动态颜色使用 `--tag-color` CSS 变量传递
3. Multi 标签需要同时使用 `.tag`、`.tag__multi` 和颜色变体类
4. 静态颜色变体依赖主色变量定义

---

*文档版本：v1.0*
*创建日期：2025-12-26*
*适用项目：V1-speak-miniapp*
