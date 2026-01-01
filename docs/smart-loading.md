# 智能加载优化方案

> 更新日期：2026-01-01
> 适用项目：微信小程序
> 可复用到其他项目

## 一、优化目标

1. **减少首页加载时间**：从 1500-2500ms 优化到 300-800ms
2. **减少页面刷新频率**：后台返回不刷新，子页面返回静默刷新
3. **提升用户体验**：使用 diff 更新避免页面闪烁，保持滚动位置

---

## 二、核心文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `behaviors/smartLoading.js` | 新增 | 智能加载控制 behavior |
| `utils/diff.js` | 新增 | 数据 diff 工具 |
| `behaviors/pageLoading.js` | 修改 | 进度条优化（减少 setData） |
| `utils/api.js` | 修改 | 添加 autoSetData 参数 |
| `app.js` | 修改 | 后台状态追踪 + 数据预加载 |

---

## 三、新增文件

### 3.1 behaviors/smartLoading.js

智能加载控制核心，管理页面刷新策略。

```javascript
/**
 * 智能加载控制 Behavior
 * 用于优化页面刷新策略，减少不必要的加载
 */
module.exports = Behavior({
  data: {
    _hasLoaded: false,      // 是否已加载过
    _needRefresh: false,    // 是否需要刷新
    _lastLoadTime: 0,       // 上次加载时间
  },

  methods: {
    /**
     * 判断是否需要加载数据
     * @param {Object} options
     * @param {number} options.cacheTime 缓存有效期（毫秒），默认不过期
     * @param {boolean} options.forceRefresh 强制刷新
     * @returns {boolean}
     */
    shouldLoad(options = {}) {
      const { cacheTime = 0, forceRefresh = false } = options

      // 强制刷新
      if (forceRefresh) return true

      // 首次加载
      if (!this.data._hasLoaded) return true

      // 标记需要刷新
      if (this.data._needRefresh) {
        this.setData({ _needRefresh: false })
        return true
      }

      // 缓存过期检查
      if (cacheTime > 0 && Date.now() - this.data._lastLoadTime > cacheTime) {
        return true
      }

      return false
    },

    /**
     * 判断是否需要静默刷新（不显示 loading，后台更新数据）
     * @returns {boolean}
     */
    shouldSilentRefresh() {
      return this.data._hasLoaded
    },

    /**
     * 标记已加载完成
     */
    markLoaded() {
      this.setData({
        _hasLoaded: true,
        _lastLoadTime: Date.now()
      })
    },

    /**
     * 标记需要刷新（供子页面调用，通知父页面刷新）
     */
    markNeedRefresh() {
      this.setData({ _needRefresh: true })
    },

    /**
     * 判断是否从后台返回
     * @returns {boolean}
     */
    isFromBackground() {
      const app = getApp()
      if (app._fromBackground) {
        app._fromBackground = false
        return true
      }
      return false
    },

    /**
     * 通知父页面需要刷新
     */
    notifyParentRefresh() {
      const pages = getCurrentPages()
      if (pages.length >= 2) {
        const parentPage = pages[pages.length - 2]
        if (parentPage.markNeedRefresh) {
          parentPage.markNeedRefresh()
        }
      }
    }
  }
})
```

### 3.2 utils/diff.js

数据 diff 工具，比对新旧数据只更新变化字段。

```javascript
/**
 * 数据 Diff 工具
 * 用于比对新旧数据，生成最小化的 setData 更新路径
 * 避免整体替换导致的页面闪烁
 */

/**
 * 深度比对两个值是否相等
 */
function isEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!isEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}

/**
 * 比对新旧数据，生成 setData 所需的更新对象
 * @param {Object} oldData 旧数据
 * @param {Object} newData 新数据
 * @param {string} prefix 路径前缀
 * @param {Object} updates 更新对象（内部递归用）
 * @returns {Object} setData 更新对象，如 { 'list[0].tag': 'new' }
 */
function diff(oldData, newData, prefix = '', updates = {}) {
  if (oldData === newData) return updates

  if (newData === null || newData === undefined) {
    return updates
  }

  if (oldData === null || oldData === undefined) {
    if (prefix) {
      updates[prefix] = newData
    } else {
      Object.assign(updates, newData)
    }
    return updates
  }

  if (typeof oldData !== typeof newData) {
    updates[prefix || ''] = newData
    return updates
  }

  // 数组处理
  if (Array.isArray(newData)) {
    if (!Array.isArray(oldData)) {
      updates[prefix] = newData
      return updates
    }

    if (oldData.length !== newData.length) {
      updates[prefix] = newData
      return updates
    }

    for (let i = 0; i < newData.length; i++) {
      const itemPath = prefix ? `${prefix}[${i}]` : `[${i}]`

      if (!isEqual(oldData[i], newData[i])) {
        if (typeof newData[i] === 'object' && newData[i] !== null &&
            typeof oldData[i] === 'object' && oldData[i] !== null) {
          diff(oldData[i], newData[i], itemPath, updates)
        } else {
          updates[itemPath] = newData[i]
        }
      }
    }
    return updates
  }

  // 对象处理
  if (typeof newData === 'object') {
    for (const key of Object.keys(newData)) {
      const keyPath = prefix ? `${prefix}.${key}` : key

      if (!isEqual(oldData[key], newData[key])) {
        if (typeof newData[key] === 'object' && newData[key] !== null &&
            typeof oldData[key] === 'object' && oldData[key] !== null &&
            !Array.isArray(newData[key])) {
          diff(oldData[key], newData[key], keyPath, updates)
        } else {
          if (Array.isArray(newData[key]) && Array.isArray(oldData[key]) &&
              newData[key].length === oldData[key].length) {
            diff(oldData[key], newData[key], keyPath, updates)
          } else {
            updates[keyPath] = newData[key]
          }
        }
      }
    }
    return updates
  }

  if (oldData !== newData) {
    updates[prefix] = newData
  }

  return updates
}

/**
 * 智能 setData：比对后只更新变化的字段
 * @param {Object} page 页面实例 (this)
 * @param {Object} newData 新数据
 * @param {Function} callback setData 完成后的回调
 * @returns {boolean} 是否有数据更新
 */
function diffSetData(page, newData, callback) {
  const updates = diff(page.data, newData)
  const hasUpdates = Object.keys(updates).length > 0

  if (hasUpdates) {
    page.setData(updates, callback)
  } else if (callback) {
    callback()
  }

  return hasUpdates
}

module.exports = {
  diff,
  diffSetData,
  isEqual
}
```

---

## 四、修改文件

### 4.1 app.js 修改

添加后台状态追踪和数据预加载。

```javascript
// 新增 globalData 属性
globalData: {
  // ... 原有属性
  windowWidth: null,
  systemInfo: null,
  homeDataCache: null,        // 首页数据预加载缓存
  popularScienceCache: null,  // 科普数据预加载缓存
},

// 新增 onShow 中的后台标记
onShow: function () {
  this._fromBackground = true
  // ... 原有更新检查逻辑
},

// 新增 onHide
onHide: function () {
  this._hideTime = Date.now()
},

// 修改 onLaunch
onLaunch() {
  // 预获取系统信息（异步，避免同步调用阻塞）
  wx.getSystemInfo({
    success: (res) => {
      this.globalData.windowWidth = res.windowWidth
      this.globalData.systemInfo = res
    }
  })

  // 自动登录 + 首页数据预加载（并行执行）
  const loginPromise = this._doLogin()
  const preloadPromise = this._preloadHomeData()

  loginPromise.then(() => {
    userData.login = true
  })
},

// 新增预加载方法
_preloadHomeData() {
  const baseUrl = 'https://your-api-domain/api'

  const homePromise = new Promise((resolve) => {
    wx.request({
      url: baseUrl + '/v2/home/list',
      method: 'GET',
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.data && res.data.code == '200') {
          this.globalData.homeDataCache = res.data.data
        }
        resolve()
      },
      fail: () => resolve()
    })
  })

  // ... 其他预加载请求

  return Promise.all([homePromise, ...])
}
```

### 4.2 behaviors/pageLoading.js 修改

优化进度条动画，减少 setData 调用。

```javascript
// 修改前：使用 setInterval，9-10 次 setData
// 修改后：使用 setTimeout + CSS transition，2-3 次 setData

startLoading() {
  if (this._progressTimer) {
    clearTimeout(this._progressTimer)
  }
  this.setData({
    loading: true,
    loadProgress: 5
  })
  // 使用 CSS transition 实现平滑动画，只需一次 setData
  this._progressTimer = setTimeout(() => {
    this.setData({ loadProgress: 90 })
  }, 50)
},

finishLoading() {
  if (this._progressTimer) {
    clearTimeout(this._progressTimer)
  }
  this.setData({ loadProgress: 100 })
  setTimeout(() => {
    this.setData({
      loading: false,
      loadProgress: 0
    })
  }, 200)
}
```

配套 CSS 修改 (`style/page-loading.wxss`)：

```css
.page-loading-bar__inner {
  transition: width 1.5s ease-out;  /* 从 0.1s 改为 1.5s */
}

.page-loading-bar__inner.finishing {
  transition: width 0.2s ease-out;
}
```

### 4.3 utils/api.js 修改

添加 `autoSetData` 参数支持。

```javascript
/**
 * 微信请求方法
 * @param {Object} that 当前页面this
 * @param {string} url 请求地址
 * @param {Object} data 请求数据
 * @param {boolean} hasToast 是否需要显示toast(下拉刷新不需要toast)
 * @param {string} method GET或POST请求
 * @param {boolean} autoSetData 是否自动调用setData（默认true，设为false可手动控制）
 */
function request(that, url, data, hasToast, method, autoSetData) {
  // 默认自动 setData（保持向后兼容）
  if (autoSetData === undefined) {
    autoSetData = true
  }

  // ... 原有逻辑

  success: function (res) {
    if (res.data.code == '200') {
      // 只有 autoSetData 为 true 时才自动调用 setData
      if (autoSetData && isNotEmpty(that) && !isEmpty(that.route) && !isEmpty(res.data.data)) {
        that.setData(res.data.data)
      }
      resolve(res.data.data)
    }
    // ...
  }
}
```

---

## 五、页面改造模板

### 5.1 标准页面改造

```javascript
const api = getApp().api
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const pageGuard = require('../../behaviors/pageGuard')
const smartLoading = require('../../behaviors/smartLoading')
const { diffSetData } = require('../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],

  data: {
    // ... 页面数据
  },

  onShow() {
    const isFirstLoad = !this.data._hasLoaded

    // 从后台返回，不刷新
    if (!isFirstLoad && this.isFromBackground()) {
      return
    }

    // 首次加载：显示 loading
    if (isFirstLoad) {
      this.startLoading()
      this.hideLoadError()
      this.loadData(true)
    } else {
      // 从子页面返回：静默刷新
      this.loadData(false)
    }
  },

  loadData(showLoading) {
    // hasToast: true 表示不显示 loading，false 表示显示 loading
    const hasToast = !showLoading

    api.request(this, '/your/api', {
      // params
    }, hasToast, 'GET', false)  // autoSetData = false
      .then(res => {
        // 使用 diff 更新，只更新变化的字段
        diffSetData(this, res)
        this.markLoaded()
        this.setDataReady()
      })
      .catch(() => { pageGuard.showRetry(this) })
      .finally(() => { this.finishLoading() })
  }
})
```

---

## 六、遇到的问题与解决方案

### 6.1 首页首次加载被跳过

**问题描述**：首页首次加载时，页面一直是白页。

**原因分析**：`app.js` 的 `onShow` 在 App 启动时也会触发，设置了 `_fromBackground = true`。首页的 `isFromBackground()` 返回 true，导致跳过加载。

**解决方案**：添加 `isFirstLoad` 检查，首次加载时不检查后台状态。

```javascript
onShow() {
  const isFirstLoad = !this.data._hasLoaded

  // 首次加载必须执行，不检查后台返回状态
  if (!isFirstLoad && this.isFromBackground()) {
    return
  }

  // ... 正常加载逻辑
}
```

### 6.2 首页只加载部分数据

**问题描述**：首页只显示"科普"部分，主内容不显示，无进度条和骨架屏。

**原因分析**：预加载条件判断错误。

```javascript
// 错误写法
if (app.globalData.homeDataCache || app.globalData.popularScienceCache) {
  this._useCachedData(app)  // 只有科普缓存时也进入此分支
  return
}
```

预加载时没有 token，主数据接口需要认证返回空，但科普接口不需要认证有数据。

**解决方案**：只在主数据缓存存在时才使用缓存。

```javascript
// 正确写法
if (app.globalData.homeDataCache) {
  this._useCachedData(app)
  return
}
```

### 6.3 静默刷新时显示 loading toast

**问题描述**：从子页面返回时，会闪一下 "努力加载中..." 的 toast。

**原因分析**：`api.request` 的 `hasToast` 参数逻辑是反的。

```javascript
// api.js 中的逻辑
if (!hasToast) {  // hasToast = false 时显示 loading
  timer = setTimeout(() => {
    wx.showLoading({ title: '努力加载中...' })
  }, 500)
}
```

静默刷新时传入 `showLoading = false`，被直接作为 `hasToast` 参数。

**解决方案**：反转参数逻辑。

```javascript
loadData(showLoading) {
  // hasToast: true 表示不显示 loading，false 表示显示 loading
  const hasToast = !showLoading  // 反转逻辑

  api.request(this, '/api', {}, hasToast, 'GET', false)
}
```

---

## 七、刷新策略总结

| 场景 | 策略 | 说明 |
|------|------|------|
| 首次加载 | 显示 loading | 完整加载流程 |
| 从子页面返回 | 静默刷新 | 后台请求 + diff 更新 |
| 从后台返回 | 不刷新 | 保持现有状态 |
| 下拉刷新 | 显示 loading | 完整刷新 |
| 重试加载 | 显示 loading | 完整加载流程 |

---

## 八、性能对比

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首页加载时间 | 1500-2500ms | 300-800ms |
| 进度条 setData 次数 | 9-10 次 | 2-3 次 |
| 返回页面刷新 | 整体刷新+闪烁 | 静默 diff 更新 |
| 后台返回 | 每次刷新 | 不刷新 |

---

## 九、复用指南

1. 复制 `behaviors/smartLoading.js` 和 `utils/diff.js` 到目标项目
2. 修改 `app.js` 添加 `_fromBackground` 追踪
3. 修改 `utils/api.js` 添加 `autoSetData` 参数
4. 按模板改造需要优化的页面
5. 注意 `hasToast` 参数的逻辑（true = 不显示 loading）

---

## 十、已优化的页面清单

### 10.1 首页模块
- `pages/home/home.js` - 首页（预加载 + 缓存）

### 10.2 P1 模块
- `pages/question/set-p1-list/index.js` - 套题列表
- `pages/question/question-p1-list/index.js` - 题目列表
- `pages/question/question-p1-detail/index.js` - 题目详情

### 10.3 P2/P3 模块
- `pages/question/set-p2p3-list/index.js` - 套题列表
- `pages/question/question-p2-detail/index.js` - P2 详情
- `pages/question/question-p3-list/index.js` - P3 列表
- `pages/question/question-p3-detail/index.js` - P3 详情

### 10.4 科普模块
- `pages/science/list/index.js` - 科普列表（只首次加载，不刷新）
- `pages/science/detail/index.js` - 科普详情（只首次加载，不刷新）

### 10.5 录音模块
- `pages/recording/p1p2p3-record-list/index.js` - 录音列表（标准刷新模式）
- `pages/recording/history-record-detail/index.js` - 录音详情（只在 onLoad 加载，无需改造）

---

## 十一、已移除的模块

### 11.1 p2-block 和 p3-block 模块（2026-01-01 移除）
- 原因：没有入口，后台也没有相关逻辑
- 移除文件：32 个文件，约 1824 行代码
- 移除页面：
  - `pages/p2-block/home/index`
  - `pages/p2-block/record/index`
  - `pages/p3-block/home/index`
  - `pages/p3-block/record/index`
  - 等共 7 个页面

### 11.2 ai-correction 模块（2026-01-01 移除）
- 原因：没有入口，页面无法访问
- 移除文件：8 个文件
- 移除页面：
  - `pages/question/ai-correction/index`
  - `pages/question/ai-correction-detail/index`
