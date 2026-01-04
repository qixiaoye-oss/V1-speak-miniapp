/**
 * 头部横幅组件，带渐变背景
 * 支持自定义标题、副标题、主题色，以及通过 slot 插入内容
 */
Component({
  options: {
    multipleSlots: true
  },
  properties: {
    /** 主标题 */
    title: {
      type: String,
      value: ''
    },
    /** 副标题 */
    subtitle: {
      type: String,
      value: ''
    },
    /** 主题色（CSS 颜色值），默认使用主蓝色 */
    color: {
      type: String,
      value: '#00A6ED'
    }
  }
})
