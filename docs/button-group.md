# 按钮组样式规范文档

微信小程序通用按钮组 **CSS 样式工具类库**，提供固定底部容器、多种布局模式和蒙版功能。

> **注意**：这是一个纯 CSS 样式库，不是微信小程序自定义组件。
> 通过 `@import` 引入样式后，直接在 wxml 中使用 CSS 类名即可。
> 推荐配合 `tap-action` 组件使用，自动封装点击动效。

**版本：** v4.1.0
**更新日期：** 2025-12-20

---

## 一、概述

### 1.1 文件版本对照

| 文件 | 版本 | 路径 |
|------|------|------|
| 样式文件 | v4.0.0 | `style/button-group.wxss` |
| 点击组件 | v4.0.0 | `components/tap-action/` |
| 高度计算 | v4.0.0 | `behaviors/button-group-height.js` |
| 本文档 | v4.1.0 | `docs/button-group.md` |

### 1.2 快速引入

```css
/* app.wxss */
@import "style/button-group.wxss";
```

```json
/* app.json 或页面 json */
{
  "usingComponents": {
    "tap-action": "/components/tap-action/index"
  }
}
```

### 1.3 主要特性

- 纯 CSS 实现，无需 js/json/wxml 文件
- data-icon 图标颜色自动映射
- 固定底部按钮组容器（含蒙版）
- 多种布局方式（split 双层、single 单层）
- Hint Banner 提示横幅
- 按钮角标自动继承图标主色
- 动态高度计算 Behavior

---

## 二、按钮组布局

### 2.1 底部固定容器

```xml
<view class="btn-page-bottom">
  <!-- 按钮组内容 -->
</view>
```

`.btn-page-bottom` 固定在页面底部，包含双层蒙版：
- **蒙版A (::before)**：纯白背景，覆盖按钮组到屏幕底部
- **蒙版B (::after)**：白到透明渐变，高度 15px，位于按钮组上方

### 2.2 单层布局 (single)

适用于简单场景，所有按钮居中排列：

```xml
<view class="btn-page-bottom">
  <view class="btn-group-single">
    <tap-action icon="correct" bind:tap="submit">
      <view>提交</view>
      <image src="/images/v2/correct_bt.png"></image>
    </tap-action>
  </view>
</view>
```

**高度**：102px（含 bottom-distance 和 gap）

### 2.3 双层布局 (split)

适用于复杂场景，分为 header（主按钮区）和 footer（辅助按钮区）：

```xml
<view class="btn-page-bottom">
  <view class="btn-group-split">
    <!-- 上层：主按钮 -->
    <view class="btn-group-split__header btn-pos-center">
      <tap-action icon="replay">重播</tap-action>
      <tap-action icon="play">播放</tap-action>
      <tap-action icon="next">下句</tap-action>
    </view>
    <!-- 分割线 -->
    <view class="btn-group-split__divider"></view>
    <!-- 下层：辅助按钮 -->
    <view class="btn-group-split__footer">
      <view class="btn-pos-left">
        <tap-action icon="setting">
          <image src="/images/v2/setting_bt.png"></image>
        </tap-action>
      </view>
      <view class="btn-pos-right">
        <tap-action icon="list">
          <view>句子列表</view>
          <image src="/images/v2/list_bt.png"></image>
        </tap-action>
      </view>
    </view>
  </view>
</view>
```

**高度**：168px（含 bottom-distance 和 gap）

---

## 三、tap-action 组件

### 3.1 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | String | `button` | 模式：`button`（按钮）/ `card`（卡片） |
| `icon` | String | `''` | icon 名称，用于颜色映射（仅 button 模式） |
| `disabled` | Boolean | `false` | 是否禁用 |
| `throttle` | Number | `300` | 节流时间（毫秒），设为 0 禁用节流 |

### 3.2 按钮模式（默认）

```xml
<!-- 文字+图标按钮 -->
<tap-action icon="save" bind:tap="onSave">
  <view>保存</view>
  <image src="/images/v2/save_bt.png"></image>
</tap-action>

<!-- 纯图标按钮 -->
<tap-action icon="play" bind:tap="onPlay">
  <image src="/images/v2/play_bt.png"></image>
</tap-action>
```

### 3.3 卡片模式

卡片模式仅提供点击动效，不应用按钮样式：

```xml
<tap-action type="card" bind:tap="onCardTap">
  <view class="my-card">
    <!-- 卡片内容 -->
  </view>
</tap-action>
```

### 3.4 节流控制

默认 300ms 节流防止重复点击，可自定义或禁用：

```xml
<!-- 自定义节流时间 -->
<tap-action icon="save" throttle="500" bind:tap="onSave">保存</tap-action>

<!-- 禁用节流 -->
<tap-action icon="play" throttle="0" bind:tap="onPlay">播放</tap-action>
```

---

## 四、icon 颜色映射

### 4.1 映射机制

通过 `icon` 属性（或 `data-icon`）指定 icon 名称，自动应用对应的文字颜色和背景色。

### 4.2 颜色映射表

| icon | 主色 | 背景色 | 用途 |
|------|------|--------|------|
| `save` | #00A6ED | rgba(0,166,237,0.15) | 保存 |
| `play` | #00A6ED | rgba(0,166,237,0.15) | 播放 |
| `pause` | #00A6ED | rgba(0,166,237,0.15) | 暂停 |
| `replay` | #00A6ED | rgba(0,166,237,0.15) | 重播 |
| `restart` | #00A6ED | rgba(0,166,237,0.15) | 重新开始 |
| `submit` | #00A6ED | rgba(0,166,237,0.15) | 提交 |
| `next` | #00A6ED | rgba(0,166,237,0.15) | 下一个 |
| `goto` | #00A6ED | rgba(0,166,237,0.15) | 跳转 |
| `updown` | #00A6ED | rgba(0,166,237,0.15) | 上下切换 |
| `go` | #00A6ED | rgba(0,166,237,0.15) | 前往 |
| `stop` | #00A6ED | rgba(0,166,237,0.15) | 停止 |
| `down` | #00A6ED | rgba(0,166,237,0.15) | 下载 |
| `correct` | #00D26A | rgba(0,210,106,0.15) | 正确答案 |
| `flag` | #F8312F | rgba(248,49,47,0.15) | 标记 |
| `medal` | #F8312F | rgba(248,49,47,0.15) | 勋章 |
| `pin` | #F8312F | rgba(248,49,47,0.15) | 固定提示 |
| `visible` | #7D4533 | rgba(125,69,51,0.15) | 显示 |
| `hidden` | #7D4533 | rgba(125,69,51,0.15) | 隐藏 |
| `list` | #FFB02E | rgba(255,176,46,0.15) | 列表 |
| `setting` | #998EA4 | rgba(153,142,164,0.15) | 设置 |
| `me` | #533566 | rgba(83,53,102,0.15) | 个人中心 |
| `controller` | #433B6B | rgba(67,59,107,0.15) | 练习/打卡 |
| `desktop_mic` | #212121 | rgba(33,33,33,0.15) | 录音 |

### 4.3 维护流程

新增 icon 时需同步更新 `style/button-group.wxss`，添加对应的 `[data-icon="xxx"]` 选择器。

---

## 五、Hint Banner 提示横幅

### 5.1 基础用法

hint_banner 是位于按钮组顶端的提示区域，通过 `data-icon` 指定颜色主题：

```xml
<view class="btn-page-bottom">
  <!-- hint_banner 在按钮组外部上方 -->
  <view class="btn-group-hint-banner" data-icon="list">
    录音已经播放完毕，点击去答题填写答案
  </view>
  <!-- 按钮组主体 -->
  <view class="btn-group-single">
    <tap-action icon="go">去答题</tap-action>
  </view>
</view>
```

### 5.2 结构与高度

**基本规范：**

| 属性 | 值 | 说明 |
|------|-----|------|
| `font-size` | 14px | 文字字体大小 |
| `line-height` | 1.4 | 行高 |
| `padding` | 10px 40px | 上下内边距10px，左右内边距40px |
| `text-align` | center | 文字居中显示 |

**高度计算：**

| 类型 | 计算公式 | 高度 |
|------|----------|------|
| 单行 | 14px × 1.4 + 10px × 2 | 39.6px |
| 双行 | 14px × 1.4 × 2 + 10px × 2 | 59.2px |

**按钮组总高度（含 hint_banner）：**

| 布局 | 无 hint | 单行 hint | 双行 hint |
|------|---------|-----------|-----------|
| 双层结构 | 168px | 207.6px | 227.2px |
| 单层结构 | 102px | 141.6px | 161.2px |

### 5.3 颜色主题

hint_banner 使用与按钮相同的 icon 颜色映射（参考 4.2），但**图标不显示**。

---

## 六、按钮角标

### 6.1 基础用法

角标用于显示数量提示（如录音数量、倍速等）：

```xml
<tap-action icon="controller" bind:tap="handleTap">
  <view>打卡/录音</view>
  <image src="/images/v2/controller_bt.png"></image>
  <view class="btn-corner-mark" wx:if="{{count > 0}}">{{count}}</view>
</tap-action>
```

### 6.2 定位原理

角标使用 `transform: translate(50%, -50%)` 定位：

```css
.btn-corner-mark {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%) scale(0.9);
}
```

- `top: 0; right: 0` - 将角标原点定位到按钮右上角
- `translate(50%, -50%)` - 向右移动自身宽度的 50%，向上移动自身高度的 50%
- 最终效果：角标中心点与按钮右上角精确重合

### 6.3 颜色继承

角标颜色**自动继承**父元素 `data-icon` 的主色，无需手动指定。

| 父元素 icon | 角标颜色 |
|-------------|----------|
| `controller` | #433B6B |
| `desktop_mic` | #212121 |
| `save` / `play` / `pause` / `replay` / `go` | #00A6ED |

---

## 七、按钮位置类

### 7.1 位置类说明

| 类名 | 用途 | 特性 |
|------|------|------|
| `.btn-pos-left` | 左侧按钮组 | 支持多个按钮，自动 15px 间距，整体靠左 |
| `.btn-pos-right` | 右侧按钮组 | 支持多个按钮，自动 15px 间距，整体靠右 |
| `.btn-pos-center` | 居中按钮组 | 支持多个按钮，自动 15px 间距，整体居中 |

### 7.2 使用场景

**场景1：全部按钮居中**

```xml
<view class="btn-group-split__header btn-pos-center">
  <tap-action icon="replay">重播</tap-action>
  <tap-action icon="play">播放</tap-action>
  <tap-action icon="next">下句</tap-action>
</view>
```

**场景2：左右分布**

```xml
<view class="btn-group-split__footer">
  <view class="btn-pos-left">
    <tap-action icon="setting">
      <image src="/images/v2/setting_bt.png"></image>
    </tap-action>
  </view>
  <view class="btn-pos-right">
    <tap-action icon="list">
      <view>句子列表</view>
      <image src="/images/v2/list_bt.png"></image>
    </tap-action>
  </view>
</view>
```

---

## 八、按钮状态

### 8.1 禁用状态

```xml
<tap-action icon="go" disabled="{{true}}">
  <image src="/images/v2/go_bt.png"></image>
</tap-action>
```

禁用状态下：
- 不响应点击事件
- 应用 `.btn--dis` 样式（opacity: 0.3）

### 8.2 点击反馈

`tap-action` 组件内置点击反馈动画：

```css
.tap-active {
  opacity: 0.7;
  transform: scale(0.98);
  transition: all 0.1s ease-out;
}
```

---

## 九、页面布局与高度计算

### 9.1 蒙版结构

```
┌─────────────────────────────┐
│                             │
│      页面内容区域            │
│                             │
├─────────────────────────────┤ ← 蒙版 A/B 交界处
│░░░░░ 蒙版B (15px) ░░░░░░░░░│ ← 渐变（白→透明）
├─────────────────────────────┤
│     .btn-page-bottom        │ ← 蒙版A（纯白背景）
│     按钮组内容               │
├─────────────────────────────┤
│  bottom-distance (20px)     │
└─────────────────────────────┘
```

### 9.2 布局模式选择

根据**按钮组高度是否动态变化**选择实现方案：

```
按钮组高度是否动态变化？
│
├─ 否（固定）→ 纯 CSS 方案（9.3）
│              不需要 Behavior，使用 CSS 变量
│
└─ 是（动态）→ Behavior 方案（9.4）
               │
               ├─ 页面级滚动 → buttonGroupHeight
               │
               └─ 固定内容区域 → contentAreaHeight
```

**动态高度的触发条件：**
- hint_banner 动态显示/隐藏
- hint_banner 内容变化（行数变化）
- 按钮数量动态变化

**选择参考：**

| 页面特征 | 方案 | 示例页面 |
|----------|------|----------|
| 简单列表/详情页，按钮组固定 | 纯 CSS | result_list, notice/detail |
| 有动态 hint_banner | Behavior | word_dictation, spot_dictation |
| 有 swiper/固定头部 | Behavior | wrong_exam |

### 9.3 纯 CSS 方案（固定高度）

适用于按钮组高度固定不变的页面，**不需要引入 Behavior**。

**方式一：WXSS 设置 page padding-bottom（推荐）**

```css
/* 页面.wxss */
page {
  padding-bottom: var(--button-group-total-height-single);  /* 单层 102px */
  /* 或 var(--button-group-total-height) 双层 168px */
}
```

```xml
<!-- 页面.wxml - 无需额外处理 -->
<view class="content">
  <!-- 页面内容 -->
</view>

<view class="btn-page-bottom">
  <view class="btn-group-single">
    <tap-action icon="save">保存</tap-action>
  </view>
</view>
```

**方式二：WXML inline style**

适用于 WXSS 中不便设置 page 样式的情况：

```xml
<view class="content" style="padding-bottom: var(--button-group-total-height-single)">
  <!-- 页面内容 -->
</view>
```

> **注意**：不要同时使用两种方式，会导致双重间距。

### 9.4 Behavior 方案（动态高度）

适用于按钮组高度可能变化的页面，**需要引入 Behavior**。

**基础用法：**

```javascript
const buttonGroupHeight = require('../../behaviors/button-group-height')

Page({
  behaviors: [buttonGroupHeight],

  onDataReady() {
    // 数据就绪后重新计算
    this.updateButtonGroupHeight()
  },

  toggleHint() {
    this.setData({ showHint: !this.data.showHint })
    // hint_banner 变化后重新计算
    this.updateButtonGroupHeight()
  }
})
```

**Behavior 提供的数据：**

| 数据字段 | 类型 | 默认值 | 说明 |
|----------|------|--------|------|
| `buttonGroupHeight` | Number | 0 | 按钮组总高度（元素高度 + 20px + 15px） |
| `contentAreaHeight` | Number | 0 | 内容区域可用高度（视口 - header - 按钮组） |

**场景一：页面级滚动 + 动态高度**

内容随页面滚动，用 `buttonGroupHeight` 设置 padding-bottom：

```xml
<view class="content" style="padding-bottom: {{buttonGroupHeight ? buttonGroupHeight + 'px' : 'var(--button-group-total-height-single)'}}">
  <!-- 页面滚动内容 -->
</view>

<view class="btn-page-bottom">
  <view class="btn-group-hint-banner" wx:if="{{showHint}}">动态提示</view>
  <view class="btn-group-single">...</view>
</view>
```

**场景二：固定内容区域 + 动态高度**

内容区域固定高度，内部有 scroll-view 或 swiper，用 `contentAreaHeight` 设置高度：

```xml
<view class="header_container">...</view>

<view class="content-area" style="height: {{contentAreaHeight ? contentAreaHeight + 'px' : 'calc(100vh - var(--button-group-total-height-with-hint))'}}; flex: none">
  <swiper><!-- 或 scroll-view --></swiper>
</view>

<view class="btn-page-bottom">
  <view class="btn-group-hint-banner" wx:if="{{showHint}}">动态提示</view>
  <view class="btn-group-split">...</view>
</view>
```

**CSS Fallback 说明：**

- `buttonGroupHeight` / `contentAreaHeight` 默认值为 `0`
- 使用三元表达式提供 CSS 变量作为初始 fallback
- Behavior 计算完成后替换为精确值

### 9.5 header_container 处理

Behavior 会自动检测 `.header_container` 元素并从 `contentAreaHeight` 中扣除其高度：

```javascript
// Behavior 内部实现
const headerHeight = headerRect ? headerRect.height : 0
const contentHeight = viewportRect.height - headerHeight - totalHeight
```

如果页面有固定头部区域，确保使用 `.header_container` 类名。

### 9.6 加载场景处理

| 场景 | 按钮组渲染 | Behavior ready() | 是否需要手动调用 |
|------|-----------|------------------|----------------|
| audio 加载（全屏蒙版）| 始终渲染 | 有效 | 否 |
| skeleton 加载 | wx:if 延迟渲染 | 失效 | 是 |

**skeleton 页面正确写法：**

```javascript
getData() {
  api.request(this, '/api/data', params).then(() => {
    this.setDataReady()
    // 延迟计算，确保按钮组渲染完成
    wx.nextTick(() => {
      this.updateButtonGroupHeight()
    })
  })
}
```

---

## 十、标准数值与 CSS 变量

### 10.1 尺寸规范

**按钮内部数值：**

| 属性 | 数值 | 说明 |
|------|------|------|
| icon 尺寸 | 25px | 所有按钮图标统一尺寸 |
| 文字大小 | 15px | 按钮文本字体大小 |
| 按钮内边距 | 5px | 文字/图标与按钮边缘的距离 |
| 文字与图标间距 | 5px | 同一按钮内文字和图标的间距 |
| 按钮高度 | 35px | 5px(上) + 25px(icon) + 5px(下) |

**按钮组容器数值：**

| 属性 | 数值 | 说明 |
|------|------|------|
| 容器内边距 | 15px | 按钮组容器与灰框边缘的距离 |
| 按钮间距 | 15px | 相邻按钮之间的间距（gap） |
| 边框 | 1px solid | 按钮组外边框 |
| 边框颜色 | rgba(0,0,0,0.3) | 灰色边框 |
| 容器圆角 | 9px | 按钮组容器圆角半径 |

**固定底部数值：**

| 属性 | 数值 | 说明 |
|------|------|------|
| 距视窗底部 | 20px | 按钮组距视窗底边缘 |
| 距视窗左右 | 20px | 按钮组距视窗左右边缘 |
| 蒙版B高度 | 15px | 渐变蒙版高度 |

### 10.2 CSS 变量汇总

可在 `app.wxss` 中覆盖以下变量自定义样式：

```css
page {
  /* 按钮组容器 */
  --button-group-border-radius: 9px;
  --button-group-padding: 15px;
  --button-group-gap: 15px;
  --button-group-bottom-distance: 20px;

  /* 按钮 */
  --button-font-size: 15px;
  --button-icon-size: 25px;
  --button-padding: 5px;

  /* 蒙版 */
  --button-group-mask-bg: #FFFFFF;
  --button-group-mask-gradient-height: 15px;

  /* Hint Banner */
  --hint-banner-font-size: 14px;
  --hint-banner-line-height: 1.4;
  --hint-banner-padding-y: 10px;
  --hint-banner-padding-x: 40px;

  /* 高度预设值 */
  --button-group-total-height: 168px;
  --button-group-total-height-single: 102px;
  --button-group-total-height-with-hint: 227.2px;
  --button-group-total-height-single-with-hint: 141.6px;
}
```

> **注意：** 以上高度已包含 15px gap，页面直接使用变量即可，无需额外计算。

---

## 十一、完整示例

### 示例1：精听页面按钮组（带 hint_banner）

```xml
<view class="btn-page-bottom">
  <view class="btn-group-hint-banner" data-icon="list">
    录音已经播放完毕，点击去答题填写答案
  </view>
  <view class="btn-group-split">
    <view class="btn-group-split__header btn-pos-center">
      <tap-action icon="replay" bind:tap="replay">
        <view>重播</view>
        <image src="/images/v2/replay_bt.png"></image>
      </tap-action>
      <tap-action icon="play" bind:tap="play">
        <view>播放</view>
        <image src="/images/v2/play_bt.png"></image>
      </tap-action>
      <tap-action icon="correct" bind:tap="markCorrect">
        <view>听懂</view>
        <image src="/images/v2/correct_bt.png"></image>
      </tap-action>
    </view>
    <view class="btn-group-split__divider"></view>
    <view class="btn-group-split__footer">
      <view class="btn-pos-left">
        <tap-action icon="setting">
          <image src="/images/v2/setting_bt.png"></image>
        </tap-action>
      </view>
      <view class="btn-pos-right">
        <tap-action icon="list" bind:tap="toList">
          <view>句子列表</view>
          <image src="/images/v2/list_bt.png"></image>
        </tap-action>
      </view>
    </view>
  </view>
</view>
```

### 示例2：卡片内按钮（居右）

```xml
<view class="card">
  <view class="card-content">...</view>
  <view class="btn-pos-right">
    <tap-action icon="play" bind:tap="playAudio">
      <image src="/images/v2/play_bt.png"></image>
    </tap-action>
    <tap-action icon="goto" bind:tap="toDetail">
      <image src="/images/v2/goto_bt.png"></image>
    </tap-action>
  </view>
</view>
```

### 示例3：带角标的按钮

```xml
<tap-action icon="controller" bind:tap="handleTap">
  <view>打卡/录音</view>
  <image src="/images/v2/controller_bt.png"></image>
  <view class="btn-corner-mark" wx:if="{{recordCount > 0}}">{{recordCount}}</view>
</tap-action>
```

---

## 十二、设计决策

### 12.1 高度计算方式

**决策**：数据加载后手动调用 `updateButtonGroupHeight()`

**原因**：
- 微信小程序不支持 MutationObserver，无法监听 DOM 变化
- 手动调用更可控，避免不必要的计算
- 当前调用场景明确：数据加载后、hint_banner 内容切换时

### 12.2 CSS 变量默认值

**决策**：Behavior 默认值为 0，CSS 变量作为 fallback

**原因**：
- 让页面初始渲染时使用 CSS 变量预设值
- Behavior 计算完成后替换为精确值
- 适应任意场景（单层/双层、有无 hint_banner）

### 12.3 Behavior 防抖

**决策**：暂不添加防抖机制

**原因**：
- 已有 50ms setTimeout 延迟等待 DOM 渲染
- 当前调用频率低（数据加载后、句子切换时）
- 无明显性能问题，避免过度优化

---

## 十三、更新记录

### v4.1.0 (2025-12-20)
- **重构第九章「页面布局与高度计算」**：
  - 新增 9.2「布局模式选择」：明确决策逻辑和选择标准
  - 重写 9.3「纯 CSS 方案」：固定高度场景，不需要 Behavior
  - 重写 9.4「Behavior 方案」：动态高度场景，整合原 9.2/9.3/9.4
  - 新增决策树图示和示例页面参考
- **核心约定**：按钮组高度是否动态变化决定是否需要 Behavior
- **修复**：原 9.3 示例暗示所有页面都需要 Behavior 的误导

### v4.0.0 (2025-12-20)
- **文档整合重构**：
  - 重新组织章节结构，从 10 章整理为 13 章
  - 消除"七点五"等不规范编号
  - 新增"按钮状态"章节（第八章）
  - 新增"CSS 变量汇总"小节（10.2）
  - 删除不存在的 `icon_color_mapping.json` 文件引用
- **版本号统一**：所有相关文件版本号统一为 v4.0.0
- **补充遗漏内容**：
  - tap-action 组件 `throttle` 属性说明（3.4）
  - Behavior `header_container` 处理说明（9.5）
- **同步参考项目**：对齐 1204-ielts-speaking-miniapp v3.3.0 的 Behavior 设计

### v3.4.0 (2025-12-20)
- Behavior 默认值改为 0：让 CSS 变量作为初始 fallback

### v3.3.0 (2025-12-16)
- 新增加载场景说明：区分 audio 加载与 skeleton 加载

### v3.2.0 (2025-12-16)
- 重构页面布局文档：新增页面级滚动与固定内容区域两种方式

### v3.1.1 (2025-12-15)
- 优化角标定位：使用 `translate(50%, -50%)` 替代固定偏移值

### v3.1.0 (2025-12-14)
- 简化布局类名：`btn-group-layout-*` → `btn-group-*`

### v3.0.0 (2025-12-14)
- 新增 Hint Banner 提示横幅、高度变量及动态高度 Behavior

### v2.1.0 (2025-12-11)
- 新增角标颜色自动继承 data-icon 主色

### v2.0.0 (2025-12-10)
- 完全迁移自参考项目，新增 data-icon 颜色映射

---

**文档版本：** v4.1.0
**最后更新：** 2025-12-20
**维护者：** 开发团队
