/**
 * answer-cell 组件
 * 答案单元容器组件，用于统一展示口语答案的卡片样式
 *
 * 使用方法：
 * <answer-cell>
 *   <header slot="header" ...></header>
 *   <!-- 内容区域 -->
 *   <view>...</view>
 *   <footer slot="footer" ...></footer>
 * </answer-cell>
 */
Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared'
  },
  properties: {
    // 是否显示顶部分隔线（header 和 body 之间）
    showTopDivider: {
      type: Boolean,
      value: true
    },
    // 是否显示底部分隔线（body 和 footer 之间）
    showBottomDivider: {
      type: Boolean,
      value: true
    },
    // 是否隐藏body区域（灵感块收起时使用）
    hideBody: {
      type: Boolean,
      value: false
    }
  },
  data: {},
  methods: {}
})
