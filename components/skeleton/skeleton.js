Component({
  options: {
    multipleSlots: true,
    // 启用虚拟节点，组件不生成额外的 DOM 节点
    // 解决组件在 loading=false 时仍占用 flex/grid gap 空间的问题
    virtualHost: true
  },

  externalClasses: ['custom-class'],

  properties: {
    // 控制骨架屏显示/隐藏
    loading: {
      type: Boolean,
      value: true
    },
    // 骨架屏类型: list | card | detail | sentence | user
    type: {
      type: String,
      value: 'list'
    },
    // 骨架行数 (3-8 推荐)
    rows: {
      type: Number,
      value: 5
    },
    // 是否启用闪烁动画
    animate: {
      type: Boolean,
      value: true
    },
    // 是否显示头像占位 (list 类型)
    avatar: {
      type: Boolean,
      value: false
    },
    // 头像形状: square | circle
    avatarShape: {
      type: String,
      value: 'square'
    },
    // 是否显示操作按钮占位 (sentence 类型)
    showActions: {
      type: Boolean,
      value: true
    },
    // 骨架屏标题（可选）
    title: {
      type: String,
      value: ''
    },
    // 自定义类名（用于外部样式覆盖）
    customClass: {
      type: String,
      value: ''
    }
  },

  data: {
    rowsArray: []
  },

  lifetimes: {
    attached() {
      this.updateRowsArray();
    }
  },

  observers: {
    'rows': function() {
      this.updateRowsArray();
    }
  },

  methods: {
    updateRowsArray() {
      const rows = Math.min(Math.max(this.data.rows, 1), 10);
      const arr = [];
      for (let i = 0; i < rows; i++) {
        arr.push(i);
      }
      this.setData({ rowsArray: arr });
    }
  }
});
