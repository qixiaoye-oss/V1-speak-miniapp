/**
 * recording-cell 组件
 * 录音列表项组件，用于显示录音信息和操作按钮
 */
Component({
  properties: {
    // 录音项数据
    item: {
      type: Object,
      value: {}
    },
    // 索引
    index: {
      type: Number,
      value: 0
    }
  },

  methods: {
    // 点击详情
    onDetail() {
      this.triggerEvent('detail', { id: this.properties.item.id })
    },
    // 切换播放/停止
    onTogglePlay() {
      const { item, index } = this.properties
      this.triggerEvent('play', {
        index: index,
        playing: item.playStatus !== 'play'
      })
    },
    // 设置按钮
    onSetting() {
      this.triggerEvent('setting', { id: this.properties.item.id })
    }
  }
})
