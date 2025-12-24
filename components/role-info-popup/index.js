Component({
  properties: {
    title: {
      type: String,
      value: '有效期'
    },
    //是否显示取消按钮
    showCancel: {
      type: Boolean,
      value: false
    },
    //取消按钮文字
    cancelText: {
      type: String,
      value: '取消'
    },
    //取消按钮颜色
    cancelColor: {
      type: String,
      value: '#000000'
    },
    //确定按钮的文字
    confirmText: {
      type: String,
      value: '确定'
    },
    //确定按钮的颜色
    confirmColor: {
      type: String,
      value: '#576B95'
    },
    //是否显示modal
    show: {
      type: Boolean,
      value: false
    },
    roles: {
      type: Array
    },
    tags: {
      type: Array
    }
  },
  data: {},
  methods: {
    // 取消函数
    cancel() {
      this.setData({
        show: false
      })
      this.triggerEvent('cancel', {
        show: false
      })
    },
    // 确认函数
    confirm() {
      this.setData({
        show: false
      })
      this.triggerEvent('confirm', {
        show: false
      })
    },
  }
})