/**
 * 通用点击动效组件，封装点击反馈效果
 * @version 4.0.0
 * @date 2025-12-20
 * @see docs/button-group.md 第三章
 */
Component({
  options: {
    multipleSlots: true
  },
  properties: {
    /**
     * 模式：button（按钮）/ card（卡片）
     * - button: 应用 .btn-action 样式和 data-icon 颜色映射
     * - card: 仅提供点击动效，不应用按钮样式
     */
    type: {
      type: String,
      value: 'button'
    },
    /**
     * icon 名称，用于颜色映射（仅 button 模式）
     * 可选值：save, play, pause, replay, restart, submit, next, goto, updown, go, stop, down,
     *        correct, flag, medal, pin, visible, hidden, list, setting, me, controller, desktop_mic
     */
    icon: {
      type: String,
      value: ''
    },
    /**
     * 是否禁用
     */
    disabled: {
      type: Boolean,
      value: false
    },
    /**
     * 节流时间（毫秒），设为 0 禁用节流
     */
    throttle: {
      type: Number,
      value: 300
    }
  },
  data: {
    _isTapping: false
  },
  methods: {
    /**
     * 点击事件处理
     * 使用 catchtap 阻止事件冒泡，避免 PC 端调试时事件重复触发
     */
    onTap(e) {
      // 禁用状态不响应
      if (this.data.disabled) {
        return
      }

      // 节流处理
      if (this.data.throttle > 0 && this.data._isTapping) {
        return
      }

      if (this.data.throttle > 0) {
        this.setData({ _isTapping: true })
        setTimeout(() => {
          this.setData({ _isTapping: false })
        }, this.data.throttle)
      }

      this.triggerEvent('tap', e.detail)
    }
  }
})
