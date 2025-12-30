/**
 * footer 组件
 * 答案单元底部操作栏
 *
 * 支持两种模式：
 * 1. type="play" (默认) - 显示播放/停止按钮
 * 2. type="image" - 显示图片列表（用于灵感块）
 */
Component({
  properties: {
    // 模式类型：'play' | 'image'
    type: {
      type: String,
      value: 'play'
    },
    // === play 模式属性 ===
    // 是否正在播放
    playing: {
      type: Boolean,
      value: false
    },
    // 是否有音频（所有句子都有音频）
    hasAudio: {
      type: Boolean,
      value: false
    },
    // === image 模式属性 ===
    // 图片列表
    images: {
      type: Array,
      value: []
    }
  },
  data: {
    // 图片加载状态映射 { index: true/false }
    imageLoadedMap: {}
  },
  observers: {
    // 图片列表变化时重置加载状态（仅当URL真正变化时）
    'images': function(newImages) {
      if (!newImages || newImages.length === 0) return
      // 比较新旧图片URL，只有真正变化才重置
      const oldUrls = (this._lastImages || []).join(',')
      const newUrls = newImages.join(',')
      if (oldUrls !== newUrls) {
        this.setData({ imageLoadedMap: {} })
        this._lastImages = newImages.slice() // 保存副本
      }
    }
  },
  methods: {
    onPlayTap() {
      this.triggerEvent('play', { playing: !this.properties.playing })
    },
    // 图片加载完成
    onImageLoad(e) {
      const index = e.currentTarget.dataset.index
      this.setData({
        [`imageLoadedMap[${index}]`]: true
      })
    },
    // 图片加载失败
    onImageError(e) {
      const index = e.currentTarget.dataset.index
      this.setData({
        [`imageLoadedMap[${index}]`]: true // 失败也标记为已加载，隐藏骨架屏
      })
    },
    // 点击图片放大预览
    onImageTap(e) {
      // 标记即将进入图片预览，避免返回时页面重新加载
      getApp()._fromImagePreview = true
      const current = e.currentTarget.dataset.src
      wx.previewImage({
        current: current,
        urls: this.properties.images
      })
    }
  }
})
