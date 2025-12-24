/**
 * 灵感块组件
 * 封装 answer-cell + header + sentence + footer 的灵感块结构
 */
Component({
  properties: {
    // 灵感块标题内容
    content: {
      type: String,
      value: ''
    },
    // 灵感块句子列表
    list: {
      type: Array,
      value: []
    },
    // 灵感块图片列表
    images: {
      type: Array,
      value: []
    },
    // 背景色
    backgroundColor: {
      type: String,
      value: ''
    },
    // 是否展开
    expanded: {
      type: Boolean,
      value: false
    },
    // 索引（用于事件回传）
    index: {
      type: Number,
      value: 0
    },
    // 标签宽度
    tagWidth: {
      type: String,
      value: ''
    }
  },
  methods: {
    // 展开/收起切换
    onToggle(e) {
      this.triggerEvent('toggle', {
        index: this.properties.index,
        expanded: e.detail.expanded
      })
    }
  }
})
