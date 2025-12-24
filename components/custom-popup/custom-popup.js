Component({
  properties: {
    title: {
      type: String,
      value: '本次打卡时间'
    },
    content: {
      type: String,
    },
    //是否显示取消按钮
    showCancel: {
      type: Boolean,
      value: true
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
      value: 'rgba(2, 125, 180, 1)'
    },
    //是否显示modal
    show: {
      type: Boolean,
      value: false
    },
    selected: {
      type: Number,
      value: 0
    }
  },
  data: {},
  observers: {
    'show': function (show) {
      if (show) {
        let time = this.getNowDate()
        this.setData({
          time: time
        })
      }
    }
  },
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
        show: false,
        selected: this.data.selected
      })
    },
    getNowDate() {
      var date = new Date();
      var year = date.getFullYear(); //年份
      var month = date.getMonth() + 1; //月份
      var day = date.getDate(); //日
      var hour = function () { //获取小时
        return date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
      }
      var minute = function () { //获取分钟
        return date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      }
      var second = function () { //获取秒数
        return date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
      }
      return year + '-' + month + '-' + day + ' ' + hour() + ':' + minute() + ':' + second()
    },
    startChange: function (e) {
      var selected = e.currentTarget.dataset.item + 1;
      this.setData({
        selected: selected,
      })
    },
  }
})