Component({
  properties: {
    list: {
      type: Array
    }
  },
  data: {
    inputShowed: false,
    inputVal: '',
    hideScroll: false,
  },
  observers: {
    list(val) {
      console.log(val.length);
      this.setData({
        hideScroll: !val.length > 0
      })
    }
  },
  methods: {
    showInput() {
      this.setData({
        inputShowed: true,
      });
    },
    hideInput() {
      this.setData({
        inputVal: '',
        inputShowed: false,
      });
      this.triggerEvent('hide')
    },
    clearInput() {
      this.setData({
        inputVal: '',
      });
    },
    inputTyping(e) {
      this.setData({
        inputVal: e.detail.value,
      });
      this.triggerEvent('input', e.detail)
    },
    offline(e) {
      this.setData({
        hideScroll: true
      })
      this.triggerEvent('selectResult', e.currentTarget.dataset.item)
    }
  }
})