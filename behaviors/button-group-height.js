/**
 * 按钮组高度动态计算 Behavior
 * @version 4.0.0
 * @date 2025-12-20
 * @see docs/button-group.md 第九章
 *
 * 功能：
 * - 自动计算 .btn-page-bottom 的实际高度
 * - 动态更新页面内容区域的可用高度
 * - 支持 hint_banner 动态显示/隐藏时重新计算
 * - 支持 .header_container 高度计算（可选）
 *
 * 使用方式：
 * 1. 在页面 JS 中引入: const buttonGroupHeight = require('../../behaviors/button-group-height')
 * 2. 添加到 behaviors: behaviors: [buttonGroupHeight]
 * 3. 在 WXML 中使用: style="padding-bottom: {{buttonGroupHeight ? buttonGroupHeight + 'px' : 'var(--button-group-total-height)'}}"
 * 4. 当 hint_banner 变化时调用: this.updateButtonGroupHeight()
 */

module.exports = Behavior({
  data: {
    // 按钮组总高度（包含 bottom-distance + gap）
    // 默认值 0：让 CSS 变量作为初始 fallback，behavior 计算完成后替换为精确值
    buttonGroupHeight: 0,
    // 内容区域可用高度
    contentAreaHeight: 0,
  },

  methods: {
    /**
     * 更新按钮组高度
     * 在以下情况调用：
     * - 页面 onReady 时
     * - hint_banner 显示/隐藏时
     * - hint_banner 文字内容变化时
     */
    updateButtonGroupHeight() {
      return new Promise((resolve) => {
        // 延迟执行，确保 DOM 已更新
        setTimeout(() => {
          const query = this.createSelectorQuery()
          query.select('.btn-page-bottom').boundingClientRect()
          query.select('.header_container').boundingClientRect()
          query.selectViewport().boundingClientRect()
          query.exec((res) => {
            if (res && res[0] && res[2]) {
              const btnGroupRect = res[0]
              const headerRect = res[1]
              const viewportRect = res[2]

              // 按钮组高度 = 元素高度 + bottom-distance(20px) + gap(15px)
              const bottomDistance = 20
              const gap = 15
              const totalHeight = btnGroupRect.height + bottomDistance + gap

              // header 高度（如果存在）
              const headerHeight = headerRect ? headerRect.height : 0

              // 内容区域高度 = 视口高度 - header高度 - 按钮组总高度
              const contentHeight = viewportRect.height - headerHeight - totalHeight

              this.setData({
                buttonGroupHeight: totalHeight,
                contentAreaHeight: contentHeight
              })

              resolve({
                buttonGroupHeight: totalHeight,
                contentAreaHeight: contentHeight
              })
            } else {
              resolve(null)
            }
          })
        }, 50)
      })
    },

    /**
     * 获取按钮组各部分的高度明细
     * 用于调试或特殊需求
     */
    getButtonGroupHeightDetail() {
      return new Promise((resolve) => {
        const query = this.createSelectorQuery()
        query.select('.btn-group-hint-banner').boundingClientRect()
        query.select('.btn-group-split').boundingClientRect()
        query.select('.btn-group-single').boundingClientRect()
        query.exec((res) => {
          resolve({
            hintBanner: res[0] ? res[0].height : 0,
            splitLayout: res[1] ? res[1].height : 0,
            inlineLayout: res[2] ? res[2].height : 0
          })
        })
      })
    }
  },

  lifetimes: {
    ready() {
      // 页面准备好后自动计算高度
      this.updateButtonGroupHeight()
    }
  }
})
