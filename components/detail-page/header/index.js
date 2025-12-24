Component({
  properties: {
    title: String,
    titleBackground: String,
    iconUrl: String,
    probe: Boolean,
    // 是否为灵感块header（自动包含展开/收起功能）
    inspiration: Boolean,
    // 是否已展开（灵感块使用）
    expanded: Boolean,
  },
  methods: {
    // 切换展开/收起状态
    toggleExpand() {
      this.triggerEvent('toggle', { expanded: !this.properties.expanded })
    }
  }
})
