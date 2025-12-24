# 骨架屏实现方案

> 版本: 2.3
> 参考项目: [1216-ielts-listening-jijing-miniapp](https://github.com/qixiaoye-oss/1216-ielts-listening-jijing-miniapp)

## 一、概述

骨架屏（Skeleton Screen）是一种在页面数据加载期间显示的占位符UI，能有效减少用户感知的等待时间，提升用户体验。

### 参考项目骨架屏架构

```
1216-ielts-listening-jijing-miniapp/
├── style/
│   └── skeleton.wxss          # 全局骨架屏样式
└── components/
    └── skeleton/              # skeleton组件
        ├── skeleton.js
        ├── skeleton.json
        ├── skeleton.wxml
        └── skeleton.wxss
```

## 二、骨架屏类型

参考项目提供了5种骨架屏类型，可完全复用到本项目：

| 类型 | 说明 | 适用页面（本项目） |
|------|------|-------------------|
| `card` | 卡片网格 | 首页 home |
| `list` | 通用列表 | set-p1-list, set-p2p3-list, science/list |
| `detail` | 详情内容 | question-p1-detail, question-p2-detail, question-p3-detail, science/detail |
| `sentence` | 句子列表 | question-p1-list, question-p3-list |
| `user` | 用户信息 | user/user |

## 三、复用方案

### 3.1 需要复制的文件

从参考项目复制以下文件到当前项目：

#### 1. 全局样式文件
```
style/skeleton.wxss
```

#### 2. skeleton组件（4个文件）
```
components/skeleton/skeleton.js
components/skeleton/skeleton.json
components/skeleton/skeleton.wxml
components/skeleton/skeleton.wxss
```

### 3.2 配置修改

#### 1. app.wxss 引入骨架屏样式
```css
@import "style/skeleton.wxss";
```

#### 2. 页面 json 注册组件（在需要使用骨架屏的页面）
```json
{
  "usingComponents": {
    "skeleton": "/components/skeleton/skeleton"
  }
}
```

### 3.3 页面使用方式

#### 基本用法
```xml
<!-- 骨架屏 -->
<skeleton type="card" loading="{{loading}}" rows="{{6}}" />

<!-- 实际内容（loading为false时显示） -->
<view wx:if="{{!loading}}">
  <!-- 页面内容 -->
</view>
```

#### skeleton组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| loading | Boolean | true | 控制骨架屏显示/隐藏 |
| type | String | 'list' | 骨架屏类型: list/card/detail/sentence/user |
| rows | Number | 5 | 骨架行数 (推荐3-8) |
| animate | Boolean | true | 是否启用闪烁动画 |
| avatar | Boolean | false | 是否显示头像占位 (list类型) |
| avatarShape | String | 'square' | 头像形状: square/circle |
| showActions | Boolean | true | 是否显示操作按钮占位 (sentence类型) |
| title | String | '' | 骨架屏标题（可选） |
| customClass | String | '' | 自定义类名 |

## 四、各页面骨架屏配置建议

### 4.1 首页 (pages/home)
```xml
<skeleton type="card" loading="{{loading}}" rows="{{6}}" />
```

### 4.2 列表页面
```xml
<!-- set-p1-list, set-p2p3-list, science/list -->
<skeleton type="list" loading="{{loading}}" rows="{{5}}" avatar="{{true}}" />
```

### 4.3 详情页面
```xml
<!-- question-p1-detail, question-p2-detail, question-p3-detail -->
<skeleton type="detail" loading="{{loading}}" rows="{{3}}" />
```

### 4.4 句子/题目列表
```xml
<!-- question-p1-list, question-p3-list -->
<skeleton type="sentence" loading="{{loading}}" rows="{{4}}" showActions="{{true}}" />
```

### 4.5 用户页面
```xml
<!-- user/user -->
<skeleton type="user" loading="{{loading}}" rows="{{4}}" />
```

## 五、CSS变量定制

骨架屏样式支持CSS变量定制，可在 `app.wxss` 或页面样式中覆盖：

```css
page {
  --skeleton-bg: #f0f0f0;           /* 骨架块背景色 */
  --skeleton-highlight: #e8e8e8;     /* 闪光高亮色 */
  --skeleton-radius: 6px;            /* 圆角大小 */
  --skeleton-card-bg: #fff;          /* 卡片/容器背景色 */
  --skeleton-border-color: #eee;     /* 边框颜色 */
  --skeleton-item-gap: 15px;         /* 列表项间距 */
}
```

## 六、实现步骤

### 第一阶段：基础文件复制
1. [x] 创建 `style/skeleton.wxss`
2. [x] 创建 `components/skeleton/` 组件目录
3. [x] 在 `app.wxss` 中引入骨架屏样式

### 第二阶段：页面集成
4. [x] 首页 home 添加骨架屏
5. [x] 列表页面添加骨架屏 (set-p1-list, set-p2p3-list, science/list)
6. [x] 详情页面添加骨架屏 (question-p1-detail, question-p2-detail, question-p3-detail, science/detail)
7. [x] 用户页面添加骨架屏 (user/user)

### 第三阶段：优化调整
8. [ ] 根据实际页面布局调整骨架屏参数
9. [ ] 测试各页面加载效果

## 七、与现有加载系统的关系

当前项目已有 `pageLoading` behavior 提供进度条加载效果，骨架屏是对其的补充：

- **进度条**：显示在顶部导航栏下方，展示整体加载进度
- **骨架屏**：占据页面内容区域，模拟最终布局结构

两者可以同时使用，提供更完整的加载体验。

## 八、注意事项

1. skeleton组件使用了 `virtualHost: true`，组件不生成额外DOM节点
2. 组件的 `styleIsolation: "apply-shared"` 允许页面样式影响组件
3. 骨架屏应在数据加载前显示，数据加载完成后隐藏（通过 `loading` 属性控制）
