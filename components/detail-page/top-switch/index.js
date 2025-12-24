/**
 * 置顶开关组件
 * 独立的答案置顶开关 block
 */
Component({
  properties: {
    // 是否已置顶
    isTop: {
      type: Boolean,
      value: false
    },
    // 是否显示（多版本时显示）
    visible: {
      type: Boolean,
      value: true
    }
  },
  methods: {
    onSwitchChange(e) {
      this.triggerEvent('switch', { value: e.detail.value })
    }
  }
})
