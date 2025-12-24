/**
 * question-content 组件
 * 题目内容展示组件，用于 P1/P2/P3 详情页及录音页面
 */
Component({
  properties: {
    // 主要内容（题目文本）
    content: {
      type: String,
      value: ''
    },
    // 附加内容（P2 特有）
    additionalContent: {
      type: String,
      value: ''
    },
    // 补充内容（带"补"标签）
    supplementaryContent: {
      type: String,
      value: ''
    },
    // 背景颜色
    backgroundColor: {
      type: String,
      value: ''
    },
    // 边框颜色
    borderColor: {
      type: String,
      value: ''
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap')
    }
  }
})
