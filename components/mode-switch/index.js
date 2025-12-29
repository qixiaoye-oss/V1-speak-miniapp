/**
 * 显示模式切换组件
 * 用于列表页的 列表显示/标签显示 切换
 *
 * 属性：
 * - mode: 当前模式 ('full' | 'simple')，默认 'full'
 *
 * 事件：
 * - change: 切换时触发，返回 { mode: 'full' | 'simple' }
 */
Component({
  properties: {
    mode: {
      type: String,
      value: 'full'
    }
  },
  methods: {
    onTap() {
      const newMode = this.properties.mode === 'full' ? 'simple' : 'full'
      this.triggerEvent('change', { mode: newMode })
    }
  }
})
