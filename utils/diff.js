/**
 * 数据 Diff 工具
 * 用于比对新旧数据，生成最小化的 setData 更新路径
 * 避免整体替换导致的页面闪烁
 */

/**
 * 深度比对两个值是否相等
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
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
 * @returns {Object} setData 更新对象，如 { 'list[0].tag': 'new', 'title': 'xxx' }
 */
function diff(oldData, newData, prefix = '', updates = {}) {
  if (oldData === newData) return updates

  // 新数据为空，不处理
  if (newData === null || newData === undefined) {
    return updates
  }

  // 旧数据为空，直接设置新值
  if (oldData === null || oldData === undefined) {
    if (prefix) {
      updates[prefix] = newData
    } else {
      Object.assign(updates, newData)
    }
    return updates
  }

  // 类型不同，直接替换
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

    // 长度不同，直接替换整个数组
    if (oldData.length !== newData.length) {
      updates[prefix] = newData
      return updates
    }

    // 逐项比对
    for (let i = 0; i < newData.length; i++) {
      const itemPath = prefix ? `${prefix}[${i}]` : `[${i}]`

      if (!isEqual(oldData[i], newData[i])) {
        if (typeof newData[i] === 'object' && newData[i] !== null &&
            typeof oldData[i] === 'object' && oldData[i] !== null) {
          // 对象类型，递归比对
          diff(oldData[i], newData[i], itemPath, updates)
        } else {
          // 基本类型或结构变化，直接替换
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
          // 对象类型，递归比对
          diff(oldData[key], newData[key], keyPath, updates)
        } else {
          // 基本类型、数组或结构变化
          if (Array.isArray(newData[key]) && Array.isArray(oldData[key]) &&
              newData[key].length === oldData[key].length) {
            // 数组长度相同，递归比对
            diff(oldData[key], newData[key], keyPath, updates)
          } else {
            updates[keyPath] = newData[key]
          }
        }
      }
    }
    return updates
  }

  // 基本类型，直接比对
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
