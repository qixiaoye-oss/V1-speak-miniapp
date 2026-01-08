# 首页结构与命名规范

> 本文档说明首页（`pages/home/home`）的代码结构、命名规范和样式组织方式。

## 整体结构层级

```
home (首页容器)
├── init-loading (初始化提示)
├── skeleton (骨架屏)
│
├── head-banner (顶部横幅)
│   └── home-main-item--science (科普模块)
│       ├── home-main-item__title
│       ├── home-main-item__content--waterfall (瀑布流布局)
│       │   ├── waterfall-column (左列)
│       │   │   └── home-card--notice home-card--science (科普卡片)
│       │   └── waterfall-column (右列)
│       │       └── home-card--notice home-card--science (科普卡片)
│       └── home-view-all (查看所有)
│
├── nav-cards (小程序跳转导航)
│   ├── nav-card (机经开源题库)
│   └── nav-card (听力专项训练)
│
└── home-main-item (分组区块 - 循环渲染)
    ├── home-main-item__title (分组标题)
    ├── home-main-item__notice (说明徽章 - 可选)
    └── home-main-item__content / home-main-item__content--grid (卡片容器)
        └── home-card--subject (专项练习/套题训练卡片)
```

## 命名规范

### BEM 命名规范
采用 **BEM (Block Element Modifier)** 命名规范：

- **Block（块）**：独立的功能组件（如 `home-card`、`home-main-item`）
- **Element（元素）**：块的组成部分，使用 `__` 连接（如 `home-card__content`）
- **Modifier（修饰符）**：块或元素的状态/类型，使用 `--` 连接（如 `home-card--subject`）

---

## 科普模块 (home-main-item--science)

### 描述
科普模块位于顶部横幅内，使用**瀑布流布局**展示科普卡片，卡片高度自适应。

### 结构
```html
<view class="home-main-item home-main-item--science" wx:if="{{popularScience.list.length > 0}}">
  <view class="home-main-item__title" style="color:var(--main-blue-color)">
    {{popularScience.title}}
  </view>
  <view class="home-main-item__content--waterfall">
    <!-- 左列 -->
    <view class="waterfall-column">
      <block wx:for="{{popularScienceColumns.leftColumn}}" wx:key="id" wx:for-item="notice">
        <tap-action type="card" bind:tap="toPopularSciencePage" data-id="{{notice.id}}">
          <view class="home-card home-card--notice home-card--science">
            <view class="home-card__content">
              <view class="home-card__body-title">{{notice.title}}</view>
              <view class="home-card__body-desc">{{notice.description}}</view>
              <view class="home-card__meta" style="color: var(--main-blue-color);">查看详情</view>
            </view>
          </view>
        </tap-action>
      </block>
    </view>
    <!-- 右列 -->
    <view class="waterfall-column">
      <block wx:for="{{popularScienceColumns.rightColumn}}" wx:key="id" wx:for-item="notice">
        <!-- 同左列结构 -->
      </block>
    </view>
  </view>
  <view class="home-view-all">
    <tap-action icon="next" bind:tap="toPopularScienceListPage">
      <view>查看所有</view>
      <image src="/images/v2/next_bt.png"></image>
    </tap-action>
  </view>
</view>
```

### 科普卡片子元素说明

| 类名 | 说明 | 样式特点 |
|-----|------|---------|
| `home-card__body-title` | 标题 | 15px，**加粗**，可换行显示全部 |
| `home-card__body-desc` | 描述 | 14px，灰色，一行截断（...） |
| `home-card__meta` | 操作提示 | 12px，主蓝色，显示"查看详情" |

### 瀑布流布局样式
```css
.home-main-item__content--waterfall {
  display: flex;
  gap: 10px;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
```

### 数据分列逻辑
```javascript
_splitToColumns(list) {
  const leftColumn = []
  const rightColumn = []
  list.forEach((item, index) => {
    if (index % 2 === 0) {
      leftColumn.push(item)
    } else {
      rightColumn.push(item)
    }
  })
  return { leftColumn, rightColumn }
}
```

---

## 导航卡片 (nav-cards)

### 描述
小程序跳转导航卡片，水平排列两个入口。

### 结构
```html
<view class="nav-cards" wx:if="{{_isDataReady}}">
  <tap-action type="card" bind:tap="onNavCardTap" data-type="jijing">
    <view class="nav-card">机经开源题库</view>
  </tap-action>
  <tap-action type="card" bind:tap="onNavCardTap" data-type="tingli">
    <view class="nav-card">听力专项训练</view>
  </tap-action>
</view>
```

### 样式
```css
.nav-cards {
  display: flex;
  gap: 10px;
  width: 100%;
}

.nav-cards > tap-action {
  flex: 1;
  min-width: 0;
}

.nav-card {
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  background: #ffffff;
  border: 2px dotted var(--main-blue-color);
  border-radius: 10px;
}
```

---

## 分组区块 (home-main-item)

### 描述
分组区块，即"大卡片"，表示一个功能分组（如"专项练习"、"套题训练"）。

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

---

## 卡片类型

### 专项练习/套题训练卡片 (home-card--subject)

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
        <view class="tag tag__multi--blue" wx:if="{{subject.label}}">{{subject.label}}</view>
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

| 类名 | 说明 | 样式特点 |
|-----|------|---------|
| `home-card__content` | 卡片内容容器 | 白色背景，圆角 |
| `home-card__header` | 头部容器 | flex 布局 |
| `home-card__icon` | 图标 | 25x25px |
| `home-card__title` | 标题 | 18px，**加粗** |
| `home-card__footer` | 底部标签容器 | flex 布局，flex-wrap |

### 科普卡片 (home-card--notice home-card--science)

```html
<tap-action type="card" bind:tap="toPopularSciencePage" data-id="{{notice.id}}">
  <view class="home-card home-card--notice home-card--science">
    <view class="home-card__content">
      <view class="home-card__body-title">{{notice.title}}</view>
      <view class="home-card__body-desc">{{notice.description}}</view>
      <view class="home-card__meta" style="color: var(--main-blue-color);">查看详情</view>
    </view>
  </view>
</tap-action>
```

#### 子元素说明

| 类名 | 说明 | 样式特点 |
|-----|------|---------|
| `home-card__content` | 卡片内容容器 | 白色背景，padding 15px |
| `home-card__body-title` | 标题 | 15px，**加粗**，可换行 |
| `home-card__body-desc` | 描述 | 14px，灰色，一行截断 |
| `home-card__meta` | 操作提示 | 12px，主蓝色，"查看详情" |

---

## 布局模式对比

| 布局 | 类名 | 使用场景 | 实现方式 |
|-----|------|---------|---------|
| 单列 | `home-main-item__content` | 默认分组 | Flexbox 纵向 |
| 网格 | `home-main-item__content--grid` | `layoutMode === 'QUAD_GRID'` | CSS Grid 2列 |
| 瀑布流 | `home-main-item__content--waterfall` | 科普模块 | Flexbox 双列 |

### 样式定义

```css
/* 单列布局 */
.home-main-item__content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 网格布局 */
.home-main-item__content--grid {
  display: grid;
  grid-column-gap: 10px;
  grid-row-gap: 10px;
  grid-template-columns: repeat(2, 1fr);
}

/* 瀑布流布局 */
.home-main-item__content--waterfall {
  display: flex;
  gap: 10px;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
```

---

## 数据结构

### popularScience 数据结构
```javascript
{
  title: "科普",
  list: [
    {
      id: 1,
      title: "加群！获得更新！",
      description: "雅思考试瞬息万变，我们会在群内第一时间分享有用的资料",
      // groupTitle 和 helpfulCount 已不再使用
    }
  ]
}
```

### popularScienceColumns 数据结构（JS 处理后）
```javascript
{
  leftColumn: [/* 偶数索引项 */],
  rightColumn: [/* 奇数索引项 */]
}
```

### group 数据结构
```javascript
{
  title: "专项练习",
  layoutMode: "QUAD_GRID",  // 或其他值
  colorRgb: "rgb(255,140,0)",
  colorRgba: "rgba(255,140,0,0.1)",
  notice: {
    id: 1,
    title: "什么是专项",
    iconUrl: "/images/icon.png",
    colorRgb: "rgb(...)",
    colorRgba: "rgba(...)"
  },
  list: [/* subject 数据 */]
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
  label: "视频版",
  type: "P1"
}
```

---

## 事件处理

| 事件处理函数 | 触发元素 | 功能 |
|------------|---------|------|
| `toChildPage` | `home-card--subject` | 进入专项练习/套题训练列表 |
| `toPopularSciencePage` | `home-card--science` | 进入科普详情 |
| `toPopularScienceListPage` | `.home-view-all` | 进入科普列表 |
| `onNoticeTap` | `home-main-item__notice` | 点击说明徽章 |
| `onNavCardTap` | `.nav-card` | 小程序跳转（待实现） |

---

## 文件清单

| 文件路径 | 说明 |
|---------|------|
| `pages/home/home.wxml` | 首页模板 |
| `pages/home/home.wxss` | 首页样式（科普区域、导航卡片、瀑布流） |
| `pages/home/home.js` | 首页逻辑（含数据分列处理） |
| `style/default-styles.wxss` | 通用样式（卡片基础样式） |

---

## API 接口

| 接口路径 | 说明 | 返回数据 |
|---------|------|---------|
| `/v2/home/list` | 首页分组列表 | `list` |
| `/popular/science/v1/miniapp/home` | 科普模块数据 | `popularScience` |

---

## 设计原则

1. **语义化命名**：类名准确反映元素含义
2. **BEM 规范**：遵循 Block-Element-Modifier 命名约定
3. **类型区分**：通过修饰符明确区分卡片类型
4. **tap-action 包裹**：可点击卡片统一使用 `<tap-action type="card">` 包裹
5. **样式独立**：避免复杂的嵌套选择器
6. **易于扩展**：新增功能只需添加新修饰符
7. **瀑布流优化**：科普卡片使用瀑布流布局，适应不同高度内容

---

*文档版本：v2.0*
*更新日期：2026-01-08*
*适用项目：V1-speak-miniapp*
