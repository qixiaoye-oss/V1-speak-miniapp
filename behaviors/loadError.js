/**
 * 加载失败重试 Behavior
 * 用于策略B：显示重试按钮
 *
 * 使用方式：
 * 1. 在页面 JS 中引入：const loadError = require('../../behaviors/loadError')
 * 2. 添加到 behaviors：behaviors: [pageLoading, loadError]
 * 3. 在 WXML 中引入模板：<import src="/templates/load-error.wxml" />
 * 4. 使用模板：<template is="loadError" data="{{loadError}}" />
 * 5. 实现 retryLoad 方法
 */
module.exports = Behavior({
  data: {
    loadError: false
  },

  methods: {
    /**
     * 显示加载失败状态
     */
    showLoadError() {
      this.setData({ loadError: true })
    },

    /**
     * 隐藏加载失败状态
     */
    hideLoadError() {
      this.setData({ loadError: false })
    }
  }
})
