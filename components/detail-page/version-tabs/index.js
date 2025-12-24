Component({
  properties: {
    list: {
      type: Array,
      value: []
    },
    current: {
      type: Number,
      value: 0
    },
    activeColor: {
      type: String,
      value: ''
    }
  },
  methods: {
    onTap(e) {
      const index = e.currentTarget.dataset.index
      if (index !== this.data.current) {
        this.triggerEvent('change', { index })
      }
    }
  }
})
