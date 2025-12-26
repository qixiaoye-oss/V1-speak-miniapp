# 首页结构与命名规范

> 本文档说明首页（`pages/home/home`）的代码结构、命名规范和样式组织方式。

## 整体结构层级

```
home (首页容器)
├── page-loading (页面加载模板)
├── load-error (加载错误模板)
│
├── home-main-item (科普模块 - popularScience)
│   ├── home-main-item__title
│   ├── home-main-item__content--grid
│   │   └── home-card--notice (科普卡片)
│   └── home-view-all (查看所有)
│
└── home-main-item (分组区块 - "大卡片")
    ├── home-main-item__title (分组标题)
    ├── home-main-item__notice (说明徽章 - 可选)
    └── home-main-item__content / home-main-item__content--grid (卡片容器)
        └── home-card (卡片 - "小卡片")
            ├── home-card--subject (专项练习/套题训练卡片)
            └── home-card--notice (补充说明卡片)
```

## 命名规范

### BEM 命名规范
采用 **BEM (Block Element Modifier)** 命名规范：

- **Block（块）**：独立的功能组件（如 `home-card`、`home-main-item`）
- **Element（元素）**：块的组成部分，使用 `__` 连接（如 `home-card__content`）
- **Modifier（修饰符）**：块或元素的状态/类型，使用 `--` 连接（如 `home-card--subject`）

## 分组区块 (home-main-item)

### 描述
分组区块，即"大卡片"，表示一个功能分组（如"专项练习"、"套题训练"、"补充说明"）。

### 结构
```html
<view class="home-main-item" style="background:{{group.colorRgba}}">
  <view class="home-main-item__title" style="color:{{group.colorRgb}}">
    {{group.title}}
  </view>
  <tap-action type="card" wx:if="{{group.notice}}" bind:tap="onNoticeTap">
    <view class="home-main-item__notice" style="background: {{group.notice.colorRgba}};">
      <image class="home-main-item__notice-img" src="{{group.notice.iconUrl}}"></image>
      <view class="home-main-item__notice-text" style="color: {{group.notice.colorRgb}};">
        {{group.notice.title}}
      </view>
    </view>
  </tap-action>
  <view class="{{group.layoutMode === 'QUAD_GRID' ? 'home-main-item__content--grid' : 'home-main-item__content'}}">
    <!-- 卡片列表 -->
  </view>
</view>
```

### 子元素说明

| 类名 | 说明 | 数据来源 |
|-----|------|---------|
| `home-main-item__title` | 分组标题 | `group.title` |
| `home-main-item__notice` | 说明徽章容器（右上角） | `group.notice` |
| `home-main-item__notice-img` | 说明徽章图标 | `group.notice.iconUrl` |
| `home-main-item__notice-text` | 说明徽章文字 | `group.notice.title` |
| `home-main-item__content` | 卡片容器（单列） | - |
| `home-main-item__content--grid` | 卡片容器（网格 2x） | `group.layoutMode === 'QUAD_GRID'` |

## 卡片 (home-card)

### 描述
卡片，即"小卡片"，表示具体的功能项或信息项。分为两种：
- **专项练习/套题训练卡片**（`home-card--subject`）
- **补充说明卡片**（`home-card--notice`）

### 专项练习/套题训练卡片结构

```html
<tap-action type="card" bind:tap="toChildPage" data-id="{{subject.id}}" data-type="{{subject.type}}">
  <view class="home-card home-card--subject"
        style="background:{{group.colorRgba}};border-color:{{group.colorRgb}};">
    <view class="home-card__content">
      <view class="home-card__header">
        <image class="home-card__icon" wx:if="{{subject.iconUrl}}" src="{{subject.iconUrl}}" />
        <view class="home-card__title">{{subject.title}}</view>
      </view>
      <view class="home-card__footer">
        <view class="tag tag--dynamic-outline" style="--tag-color:{{group.colorRgb}}">
          {{subject.childTotal}}
        </view>
        <view class="tag tag--dynamic-solid" style="--tag-color:{{group.colorRgb}}" wx:if="{{subject.description}}">
          {{subject.description}}
        </view>
      </view>
    </view>
  </view>
</tap-action>
```

#### 子元素说明

| 类名 | 说明 | 数据来源 | 样式特点 |
|-----|------|---------|---------|
| `home-card__content` | 卡片内容容器 | - | 白色背景，圆角 |
| `home-card__header` | 头部容器 | - | flex 布局 |
| `home-card__icon` | 图标 | `subject.iconUrl` | 25x25px，top: 2px |
| `home-card__title` | 标题 | `subject.title` | 18px，**加粗** |
| `home-card__footer` | 底部标签容器 | - | flex 布局，flex-wrap |

### 补充说明卡片结构

```html
<tap-action type="card" bind:tap="toPopularSciencePage" data-id="{{notice.id}}">
  <view class="home-card home-card--notice"
        style="background:{{popularScience.colorRgba}};border-color:{{popularScience.colorRgb}};">
    <view class="home-card__content">
      <view class="home-card__category" style="color: {{popularScience.colorRgb}};">
        {{notice.groupTitle}}
      </view>
      <view class="home-card__body">
        <text class="home-card__body-title">{{notice.title}}</text>
        <text class="home-card__body-separator"> · </text>
        <text class="home-card__body-desc">{{notice.description}}</text>
      </view>
      <view class="home-card__meta">
        <image src="/images/v2/heart_bt.png"></image>
        <view>{{notice.helpfulCount}}人觉得有用</view>
      </view>
    </view>
  </view>
</tap-action>
```

#### 子元素说明

| 类名 | 说明 | 数据来源 | 样式特点 |
|-----|------|---------|---------|
| `home-card__content` | 卡片内容容器 | - | 白色背景，padding 15px |
| `home-card__category` | 分类标签 | `notice.groupTitle` | 12px，单行截断 |
| `home-card__body` | 正文容器 | - | 14px，最多 2 行 |
| `home-card__body-title` | 正文黑色部分 | `notice.title` | 黑色，**不加粗** |
| `home-card__body-separator` | 分隔符 | - | 灰色 " · " |
| `home-card__body-desc` | 正文灰色部分 | `notice.description` | 灰色，**不加粗** |
| `home-card__meta` | 元信息（有用人数） | `notice.helpfulCount` | 12px，flex 布局 |

## 样式特点对比

| 特性 | 专项练习/套题训练 | 补充说明 |
|-----|----------------|---------|
| 修饰符 | `--subject` | `--notice` |
| 标题样式 | 18px，**加粗** | 14px，**不加粗** |
| 文字颜色 | 纯黑色 | 黑色 + 灰色混合 |
| 内容结构 | header + footer | category + body + meta |
| 点击包裹 | `<tap-action type="card">` | `<tap-action type="card">` |

## 布局模式

### 单列布局
```css
.home-main-item__content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
```

### 网格布局
```css
.home-main-item__content--grid {
  display: grid;
  grid-column-gap: 10px;
  grid-row-gap: 10px;
  grid-template-columns: repeat(2, 1fr);
}
```

**触发条件**：`group.layoutMode === 'QUAD_GRID'`

## 数据结构

### group 数据结构
```javascript
{
  title: "专项练习",
  layoutMode: "QUAD_GRID",
  colorRgb: "rgb(255,140,0)",
  colorRgba: "rgba(255,140,0,0.1)",
  notice: {
    title: "什么是专项",
    iconUrl: "/images/icon.png",
    colorRgb: "rgb(...)",
    colorRgba: "rgba(...)"
  },
  list: [ /* subject 数据 */ ]
}
```

### subject 数据结构
```javascript
{
  id: 1,
  title: "Part 1 题目",
  iconUrl: "/images/icon.png",
  childTotal: "共100题",
  description: "初级",
  type: "P1"
}
```

### popularScience 数据结构
```javascript
{
  title: "备考技巧",
  colorRgb: "rgb(...)",
  colorRgba: "rgba(...)",
  list: [
    {
      id: 1,
      groupTitle: "口语技巧",
      title: "如何提高口语",
      description: "掌握方法...",
      helpfulCount: 128
    }
  ]
}
```

## 事件处理

| 事件处理函数 | 触发元素 | 功能 |
|------------|---------|------|
| `toChildPage` | `home-card--subject` | 进入专项练习/套题训练列表 |
| `toPopularSciencePage` | `home-card--notice` | 进入科普详情 |
| `toPopularScienceListPage` | `.home-view-all` | 进入科普列表 |
| `onNoticeTap` | `home-main-item__notice` | 点击说明徽章 |

## 文件清单

| 文件路径 | 说明 |
|---------|------|
| `pages/home/home.wxml` | 首页模板 |
| `pages/home/home.wxss` | 首页样式 |
| `pages/home/home.js` | 首页逻辑 |
| `style/default-styles.wxss` | 通用样式（首页卡片等） |

## API 接口

| 接口路径 | 说明 | 返回数据 |
|---------|------|---------|
| `/v2/home/list` | 首页分组列表 | `list` |
| `/popular/science/v1/miniapp/home` | 科普模块数据 | `popularScience` |

## 维护指南

### 新增卡片类型

1. **定义新的修饰符**
```css
.home-card--new-type .home-card__content {
  /* 自定义样式 */
}
```

2. **更新 HTML 结构**
```html
<tap-action type="card" bind:tap="onNewTypeClick">
  <view class="home-card home-card--new-type">
    <!-- 自定义内容 -->
  </view>
</tap-action>
```

3. **添加事件处理**
```javascript
onNewTypeClick(e) {
  // 处理逻辑
}
```

## 设计原则

1. **语义化命名**：类名准确反映元素含义
2. **BEM 规范**：遵循 Block-Element-Modifier 命名约定
3. **类型区分**：通过修饰符明确区分卡片类型
4. **tap-action 包裹**：可点击卡片统一使用 `<tap-action type="card">` 包裹
5. **样式独立**：避免复杂的嵌套选择器
6. **易于扩展**：新增功能只需添加新修饰符

---

*文档版本：v1.0*
*创建日期：2025-12-26*
*适用项目：V1-speak-miniapp*
