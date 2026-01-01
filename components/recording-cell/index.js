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
    },
    // 是否禁用设置按钮
    settingDisabled: {
      type: Boolean,
      value: false
    },
    // 是否显示设置按钮
    showSetting: {
      type: Boolean,
      value: true
    }
  },

  methods: {
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
      if (this.properties.settingDisabled) return
      this.triggerEvent('setting', { id: this.properties.item.id })
    }
  }
})
