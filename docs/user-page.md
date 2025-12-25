# 用户页面文档

> **版本**: 2.1.0
> **更新日期**: 2025-12-25
> **适用页面**: `pages/user/user` | `pages/user/login`

---

## 一、概述

用户模块包含两个页面：

| 页面 | 路径 | 功能 |
|------|------|------|
| 用户中心 | `pages/user/user/user` | 展示用户信息、菜单列表 |
| 用户编辑 | `pages/user/login/login` | 修改头像、昵称 |

---

## 二、页面详情

### 2.1 用户中心页 (user)

#### 文件结构

```
pages/user/user/
├── user.wxml      # 页面结构
├── user.wxss      # 页面样式
├── user.js        # 页面逻辑
└── user.json      # 页面配置
```

#### WXML 结构

```xml
<skeleton type="user" loading="{{loading}}" rows="{{4}}" />
<view class="user-page" wx:if="{{!loading}}">
  <view class="user-info">
    <image class="user__avatar" src="{{user.headUrl || '/images/wechat.png'}}" mode="cover" />
    <view class="user__nickname">
      <view>{{user.nickName || '微信用户'}}</view>
      <view class="user__no">（{{user.no}}）</view>
    </view>
  </view>
  <view class="menu-item" bind:tap="toUpdateUserInfo">修改用户信息</view>
  <view class="menu-item">权限 <text class="menu-item__value">{{permission_duration || '游客'}}</text></view>
  <block wx:if="{{user.isManager == 1}}">
    <view class="menu-item" bind:tap="toUpdateAuth">用户权限管理</view>
  </block>
  <view class="menu-item">版本 <text class="menu-item__value">{{version_number || '1.0.2'}}</text></view>
</view>
<role-info-popup wx:if="{{!loading}}" show="{{showPopup}}" validPeriods="{{validPeriods}}"></role-info-popup>
```

#### 视觉结构

```
┌─────────────────────────────────────┐
│  .user-page (主题背景色容器)          │
│  ┌─────────────────────────────────┐│
│  │  .user-info (用户信息卡片)        ││
│  │       ┌─────┐                   ││
│  │       │ 头像 │  80×80 圆形        ││
│  │       └─────┘                   ││
│  │        昵称                      ││
│  │       (用户编号)                 ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  修改用户信息                     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  权限            [权限值]         ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  版本            [版本号]         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### WXSS 样式

```css
.user-page {
  background: var(--theme-bcakground-color);
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  box-sizing: border-box;
}

.user-info {
  background-color: #ffffff;
  border: 1px solid var(--theme-color);
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-sizing: border-box;
}

.user__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.user__nickname {
  font-size: 16px;
  color: #000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.4;
}

.menu-item {
  background-color: #ffffff;
  border: 1px solid var(--theme-color);
  border-radius: 6px;
  padding: 15px;
  line-height: 1.4;
  font-size: 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-item__value {
  color: var(--main-blue-color);
}
```

#### JS 逻辑

```javascript
var api = require('../../../utils/api')
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    version: '1.0.2',
  },
  onShow: function () {
    this.startLoading()
    this.getUserInfo()
    const miniProgram = wx.getAccountInfoSync();
    this.setData({
      version: miniProgram.miniProgram.version,
    })
  },
  toUpdateUserInfo() {
    this.navigateTo('/pages/user/login/login')
  },
  toUpdateAuth() {
    this.navigateTo('/pages/teacher/widget/widget')
  },
  getUserInfo() {
    const _this = this
    api.request(this, '/user/v1/user/info', {}, true).then(() => {
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.finishProgress(_this)
    })
  },
})
```

#### 组件依赖

```json
{
  "usingComponents": {
    "role-info-popup": "/components/role-info-popup/index"
  }
}
```

---

### 2.2 用户编辑页 (login)

#### 文件结构

```
pages/user/login/
├── login.wxml      # 页面结构
├── login.wxss      # 页面样式
├── login.js        # 页面逻辑
└── login.json      # 页面配置
```

#### WXML 结构

```xml
<form bindsubmit="formSubmit" style="padding-bottom: {{buttonGroupHeight ? buttonGroupHeight + 'px' : 'var(--button-group-total-height-single)'}}">
  <view class="user-page">
    <view class="user-info">
      <button class="user__avatar-button" open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar" hover-class="tap-active">
        <image class="user__avatar" src="{{user.headUrl}}" mode="cover" />
      </button>
      <input name='headUrl' value="{{user.headUrl}}" hidden="true" />
      <input name='nickName' type="nickname" class="user__nickname" placeholder="请输入昵称" value="{{user.nickName}}" />
      <view class="remind">点击头像或昵称修改</view>
    </view>
  </view>
  <view class="btn-page-bottom">
    <view class="btn-group-single">
      <button formType="submit" class="btn-action" data-icon="save" hover-class="tap-active">
        <view>保存</view>
        <image src="/images/v2/save_bt.png"></image>
      </button>
    </view>
  </view>
</form>
```

#### 视觉结构

```
┌─────────────────────────────────────┐
│  form                               │
│  ┌─────────────────────────────────┐│
│  │  .user-page                      ││
│  │  ┌─────────────────────────────┐││
│  │  │  .user-info                  │││
│  │  │       ┌─────┐               │││
│  │  │       │ 头像 │ ← 可点击选择    │││
│  │  │       └─────┘               │││
│  │  │    ┌──────────┐             │││
│  │  │    │ 昵称输入框 │             │││
│  │  │    └──────────┘             │││
│  │  │   点击头像或昵称修改           │││
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
│                                     │
│  ════════════════════════════════   │ ← 渐变蒙层
│  ┌─────────────────────────────────┐│
│  │  .btn-page-bottom               ││
│  │  ┌─────────────────────────────┐││
│  │  │  保存   [icon]               │││ ← 蓝色按钮
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

#### WXSS 样式

```css
/* 页面内容区域 - 动态 padding-bottom 由 buttonGroupHeight behavior 计算 */
.user-page {
  background: var(--theme-bcakground-color);
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  box-sizing: border-box;
}

.user-info {
  background-color: #ffffff;
  border: 1px solid var(--theme-color);
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-sizing: border-box;
}

.user__avatar-button {
  width: 81px !important;
  height: 81px;
  border-radius: 50%;
  border-color: transparent;
  padding: 0;
}

.user__avatar-button::after {
  border: none;
}

.user__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.user__nickname {
  text-align: center;
  border: 1px solid var(--theme-color);
  padding: 10px 20px;
  width: 130px;
  line-height: 1.4;
  font-size: 16px;
  border-radius: 6px;
}

.remind {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
}

/* 重置按钮组内button的默认样式 */
.btn-group-single .btn-action {
  border: none;
  padding: 5px;
  margin: 0;
  line-height: inherit;
}

.btn-group-single .btn-action::after {
  border: none;
}
```

#### JS 逻辑

```javascript
const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const buttonGroupHeight = require('../../../behaviors/button-group-height')

Page({
  behaviors: [pageGuard.behavior, buttonGroupHeight],
  data: {
    checked: false
  },
  onReady() {
    api.request(this, '/user/v1/user/info', {}, true).catch(() => {
      // 新用户可能无数据，静默失败
    })
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const _this = this
    api.uploadFileToOSS(avatarUrl, 'user/avatar/', this).then(res => {
      _this.setData({
        [`user.headUrl`]: res
      })
    })
  },
  formSubmit(e) {
    const { nickName, headUrl } = e.detail.value
    this.uploadHead(headUrl, nickName)
  },
  uploadHead(headUrl, nickName) {
    if (api.isEmpty(headUrl)) {
      api.toast('请选择用户头像')
      return
    }
    if (api.isEmpty(nickName)) {
      api.toast('请填写用户昵称')
      return
    }
    this.updateUser(headUrl, nickName);
  },
  updateUser(headUrl, nickName) {
    api.request(this, '/user/v1/user/update', {
      nickName: nickName,
      avatarUrl: headUrl
    }, true, "POST").then(res => {
      this.navigateBack()
    }).catch(() => {
      // 保存失败仅提示，保留表单数据
    })
  }
})
```

#### 组件依赖

```json
{
  "usingComponents": {}
}
```

---

## 三、依赖清单

### 3.1 Behaviors

| Behavior | 使用页面 | 功能 |
|----------|---------|------|
| `pageGuard` | user, login | 导航守卫、定时器管理、防重复点击 |
| `pageLoading` | user | 加载进度条动画 |
| `button-group-height` | login | 按钮组高度动态计算 |

### 3.2 组件

| 组件 | 使用页面 | 功能 | 注册位置 | 必须 |
|------|---------|------|---------|------|
| `skeleton` | user | 骨架屏加载占位（type="user"） | **app.json 全局注册** | 可选 |
| `role-info-popup` | user | 权限有效期弹窗 | user.json 页面注册 | 可选 |

### 3.3 公用样式

| 样式文件 | 使用页面 | 说明 |
|----------|---------|------|
| `button-group.wxss` | login | 按钮组样式（`.btn-page-bottom`, `.btn-group-single`, `.btn-action`, `[data-icon="save"]`） |
| `skeleton.wxss` | user | 骨架屏样式（通过 app.wxss 引入） |

### 3.4 CSS 变量

```css
/* 必须在 app.wxss 中定义 */
page {
  --theme-color: rgba(0, 166, 237, 1);
  --theme-bcakground-color: rgba(0, 166, 237, 0.15);
  --main-blue-color: #00A6ED;
}
```

### 3.5 图片资源

| 图片路径 | 使用页面 | 用途 |
|----------|---------|------|
| `/images/wechat.png` | user | 默认头像占位 |
| `/images/v2/save_bt.png` | login | 保存按钮图标 |

### 3.6 API 接口

| 接口 | 方法 | 使用页面 | 用途 |
|------|------|---------|------|
| `/user/v1/user/info` | GET | user, login | 获取用户信息 |
| `/user/v1/user/update` | POST | login | 更新用户信息 |
| OSS 上传 | - | login | 头像上传 |

---

## 四、按钮组说明

login 页面使用了公用的按钮组样式，结构如下：

```
.btn-page-bottom          ← 固定底部容器（fixed 定位，带蒙层）
└── .btn-group-single     ← 单行居中布局（边框、圆角、padding）
    └── button.btn-action ← 基础按钮样式
        └── [data-icon="save"]  ← 蓝色主题（#00A6ED）
```

### 特殊处理

由于 login 页面使用原生 `<button formType="submit">` 触发表单提交，需要额外样式重置微信 button 默认样式：

```css
.btn-group-single .btn-action {
  border: none;
  padding: 5px;
  margin: 0;
  line-height: inherit;
}

.btn-group-single .btn-action::after {
  border: none;
}
```

---

## 五、复用指南

### 5.1 前提条件

目标项目已具备：
- `style/button-group.wxss` 公用样式
- `behaviors/pageGuard.js`
- `behaviors/button-group-height.js`
- `images/v2/save_bt.png`

### 5.2 必须迁移（8 个文件）

```
pages/user/
├── user/
│   ├── user.wxml
│   ├── user.wxss
│   ├── user.js
│   └── user.json
└── login/
    ├── login.wxml
    ├── login.wxss
    ├── login.js
    └── login.json
```

### 5.3 按需迁移

| 文件 | 条件 |
|------|------|
| `behaviors/pageLoading.js` | 如需 user 页面的加载进度条 |
| `components/skeleton/*` + `style/skeleton.wxss` | 如需骨架屏 |
| `components/role-info-popup/*` | 如需权限弹窗 |
| `images/wechat.png` | 如需默认头像 |

### 5.4 适配工作

1. **CSS 变量**：确认目标项目已定义 `--theme-color`、`--theme-bcakground-color`、`--main-blue-color`
2. **API 接口**：对接目标项目的请求封装和后端接口
3. **页面注册**：在 `app.json` 中添加页面路径

---

## 六、设计规范

### 6.1 尺寸规范

| 属性 | 值 |
|------|-----|
| 页面容器圆角 | 9px |
| 卡片圆角 | 6px |
| 页面/卡片内边距 | 15px |
| 元素间距 | 15px（页面）/ 10px（卡片内） |
| 头像尺寸 | 80×80px |
| 边框宽度 | 1px |

### 6.2 字体规范

| 元素 | 字号 | 颜色 | 行高 |
|------|------|------|------|
| 昵称/菜单 | 16px | #000000 | 1.4 |
| 提示文字 | 12px | rgba(0,0,0,0.4) | - |
| 菜单值 | 16px | var(--main-blue-color) | 1.4 |

### 6.3 颜色规范

| 用途 | 值 |
|------|-----|
| 主题色 | rgba(0, 166, 237, 1) / #00A6ED |
| 主题背景色 | rgba(0, 166, 237, 0.15) |
| 卡片背景 | #ffffff |
| 边框色 | var(--theme-color) |

---

## 七、更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 2.1.0 | 2025-12-25 | 补充 skeleton 组件为全局注册的说明 |
| 2.0.0 | 2025-12-25 | 重构文档，详细记录页面当前状态 |
