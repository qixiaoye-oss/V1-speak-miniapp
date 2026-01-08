/**
 * 句子音频朗读 Behavior
 * 用于口语答案中句子朗读的统一播放逻辑
 *
 * 使用方法：
 * 1. 在页面中引入: const sentenceAudio = require('../../behaviors/sentenceAudio')
 * 2. 添加到 behaviors: behaviors: [sentenceAudio]
 * 3. 在 onLoad 中调用 this.initSentenceAudio() 初始化
 * 4. 在 onUnload 中调用 this.destroySentenceAudio() 销毁
 *
 * 提供的方法：
 * - playAudio(url): 播放指定音频
 * - stopAudio(): 停止音频播放
 * - playMainAudio(): 播放题目主音频
 * - playSentence(e): 播放句子音频（支持二级/三级数据结构）
 * - playAllSentences(answerIndex): 连续播放指定答案的所有句子
 * - stopAllSentences(answerIndex): 停止连续播放
 * - resetSentenceAudioStatus(): 重置所有句子播放状态
 *
 * 数据要求：
 * - this.data.detail.audioUrl: 题目主音频地址
 * - this.data.list: 答案列表数据
 */

module.exports = Behavior({
  data: {
    audioPlayer: false // 音频播放状态
  },

  methods: {
    /**
     * 初始化句子音频 Behavior
     * 在页面 onLoad 中调用
     */
    initSentenceAudio() {
      this._sentenceAudio = wx.createInnerAudioContext()
      // 连续播放状态
      this._playAllState = null
      // 单句播放状态
      this._singlePlayState = null

      this._sentenceAudio.onPlay(() => {
        this.setData({
          audioPlayer: true
        })
      })

      this._sentenceAudio.onEnded(() => {
        // 检查是否处于连续播放模式
        if (this._playAllState) {
          this._playNextSentence()
        } else {
          // 单句播放结束，重置状态
          const singleState = this._singlePlayState
          this._singlePlayState = null

          const updates = { audioPlayer: false }
          // 如果有单句播放状态，重置对应的 isPlaying
          if (singleState) {
            // 支持自定义 isPlayingPath (P2) 或默认路径 (P1/P3)
            const isPlayingPath = singleState.isPlayingPath || `list[${singleState.answerIndex}].isPlaying`
            updates[isPlayingPath] = false
          }
          this.setData(updates)
          this.resetSentenceAudioStatus()
        }
      })

      this._sentenceAudio.onError((err) => {
        const api = getApp().api
        api.audioErr(err, this._sentenceAudio.src)
        // 出错时也尝试播放下一个
        if (this._playAllState) {
          this._playNextSentence()
        }
      })
    },

    /**
     * 销毁句子音频 Behavior
     * 在页面 onUnload 中调用
     */
    destroySentenceAudio() {
      this._playAllState = null
      this._singlePlayState = null
      if (this._sentenceAudio) {
        this._sentenceAudio.destroy()
        this._sentenceAudio = null
      }
    },

    /**
     * 播放音频
     * @param {string} url - 音频地址
     */
    playAudio(url) {
      if (!url || !this._sentenceAudio) return
      this._sentenceAudio.src = url
      wx.nextTick(() => {
        this._sentenceAudio.play()
        this.setData({
          audioPlayer: true
        })
      })
    },

    /**
     * 停止音频播放
     */
    stopAudio() {
      if (this._sentenceAudio && this.data.audioPlayer) {
        this._sentenceAudio.stop()
      }
      this.setData({
        audioPlayer: false
      })
    },

    /**
     * 统一的音频打断方法
     * 用于版本切换、难度切换等场景
     */
    interruptAudio() {
      this.stopAudio()
      this._playAllState = null
      this._singlePlayState = null
      this.resetSentenceAudioStatus()
      this._resetAllPlayingStatus()

      // 如果页面有自定义的重置方法（如 P2 的 block 状态），调用它
      if (typeof this._resetAllBlockPlayingStatus === 'function') {
        this._resetAllBlockPlayingStatus()
      }
    },

    /**
     * 播放题目主音频
     */
    playMainAudio() {
      this.stopAudio()
      this._playAllState = null
      this._singlePlayState = null
      this.resetSentenceAudioStatus()
      this._resetAllPlayingStatus()
      const detail = this.data.detail
      if (detail && detail.audioUrl) {
        this.playAudio(detail.audioUrl)
      }
    },

    /**
     * 播放句子音频（单个）
     * 支持二级结构: list[answerIndex].list[sentenceIndex]
     * 支持三级结构: list[answerIndex].list[groupIndex].list[sentenceIndex]
     * 支持点击同一句子切换停止
     * @param {Object} e - 事件对象
     */
    playSentence(e) {
      // 停止连续播放模式
      this._playAllState = null
      this._resetAllPlayingStatus()

      const { list } = this.data
      const { answerIndex, sentenceIndex, groupIndex } = e.currentTarget.dataset

      let sentence
      let path

      // 判断数据结构层级
      if (groupIndex !== undefined) {
        // 三级结构 (P3)
        sentence = list[answerIndex].list[groupIndex].list[sentenceIndex]
        path = `list[${answerIndex}].list[${groupIndex}].list[${sentenceIndex}].playStatus`
      } else {
        // 二级结构 (P1/P2)
        sentence = list[answerIndex].list[sentenceIndex]
        path = `list[${answerIndex}].list[${sentenceIndex}].playStatus`
      }

      // 检查是否点击了正在播放的同一句子（切换停止）
      if (this._singlePlayState &&
          this._singlePlayState.answerIndex === answerIndex &&
          this._singlePlayState.sentenceIndex === sentenceIndex &&
          this._singlePlayState.groupIndex === groupIndex) {
        // 停止播放
        this.stopAudio()
        this.resetSentenceAudioStatus()
        this._singlePlayState = null
        // 重置当前答案的 isPlaying 状态
        this.setData({
          [`list[${answerIndex}].isPlaying`]: false
        })
        return
      }

      if (sentence && sentence.audioUrl) {
        this.stopAudio()
        this.resetSentenceAudioStatus()

        // 记录单句播放状态
        this._singlePlayState = {
          answerIndex: answerIndex,
          sentenceIndex: sentenceIndex,
          groupIndex: groupIndex,
          path: path
        }

        this.playAudio(sentence.audioUrl)
        this.setData({
          [path]: 'playing',
          [`list[${answerIndex}].isPlaying`]: true  // 同步 footer 状态
        })
      }
    },

    /**
     * 连续播放指定答案的所有句子
     * @param {number} answerIndex - 答案索引
     */
    playAllSentences(answerIndex) {
      const { list } = this.data
      if (!list || !list[answerIndex]) return

      // 停止当前播放，清除单句播放状态
      this.stopAudio()
      this.resetSentenceAudioStatus()
      this._resetAllPlayingStatus()
      this._singlePlayState = null

      // 获取所有句子（扁平化）
      const sentences = this._flattenSentences(list[answerIndex], answerIndex)
      if (sentences.length === 0) return

      // 设置连续播放状态
      this._playAllState = {
        answerIndex: answerIndex,
        sentences: sentences,
        currentIndex: 0
      }

      // 更新答案的播放状态
      this.setData({
        [`list[${answerIndex}].isPlaying`]: true
      })

      // 开始播放第一个句子
      this._playSentenceByIndex(0)
    },

    /**
     * 停止连续播放
     * @param {number} answerIndex - 答案索引
     */
    stopAllSentences(answerIndex) {
      this.stopAudio()
      this._playAllState = null
      this._singlePlayState = null
      this.resetSentenceAudioStatus()

      // 更新答案的播放状态
      if (answerIndex !== undefined) {
        this.setData({
          [`list[${answerIndex}].isPlaying`]: false
        })
      } else {
        this._resetAllPlayingStatus()
      }
    },

    /**
     * 重置所有答案的播放状态
     * @private
     */
    _resetAllPlayingStatus() {
      const { list } = this.data
      if (!list) return

      const updates = {}
      list.forEach((item, index) => {
        if (item.isPlaying) {
          updates[`list[${index}].isPlaying`] = false
        }
      })

      if (Object.keys(updates).length > 0) {
        this.setData(updates)
      }
    },

    /**
     * 扁平化获取答案中的所有句子
     * @param {Object} answer - 答案对象
     * @param {number} answerIndex - 答案索引
     * @returns {Array} 句子数组，包含 path 和 audioUrl
     * @private
     */
    _flattenSentences(answer, answerIndex) {
      const sentences = []

      if (!answer.list) return sentences

      // 检测数据结构类型
      const firstItem = answer.list[0]
      if (firstItem && firstItem.list) {
        // 三级结构 (P3): answer.list[groupIndex].list[sentenceIndex]
        answer.list.forEach((group, groupIndex) => {
          if (group.list) {
            group.list.forEach((sentence, sentenceIndex) => {
              if (sentence.audioUrl) {
                sentences.push({
                  audioUrl: sentence.audioUrl,
                  path: `list[${answerIndex}].list[${groupIndex}].list[${sentenceIndex}].playStatus`
                })
              }
            })
          }
        })
      } else {
        // 二级结构 (P1/P2): answer.list[sentenceIndex]
        answer.list.forEach((sentence, sentenceIndex) => {
          if (sentence.audioUrl) {
            sentences.push({
              audioUrl: sentence.audioUrl,
              path: `list[${answerIndex}].list[${sentenceIndex}].playStatus`
            })
          }
        })
      }

      return sentences
    },

    /**
     * 播放指定索引的句子
     * @param {number} index - 句子在队列中的索引
     * @private
     */
    _playSentenceByIndex(index) {
      if (!this._playAllState) return

      const { sentences, answerIndex } = this._playAllState
      if (index >= sentences.length) {
        // 播放完毕
        this._playAllState = null
        this.setData({
          audioPlayer: false,
          [`list[${answerIndex}].isPlaying`]: false
        })
        this.resetSentenceAudioStatus()
        return
      }

      const sentence = sentences[index]
      this._playAllState.currentIndex = index

      // 重置所有句子状态，然后高亮当前句子
      this.resetSentenceAudioStatus()
      this.setData({
        [sentence.path]: 'playing'
      })

      // 播放音频
      this.playAudio(sentence.audioUrl)
    },

    /**
     * 播放下一个句子
     * @private
     */
    _playNextSentence() {
      if (!this._playAllState) return

      const nextIndex = this._playAllState.currentIndex + 1
      this._playSentenceByIndex(nextIndex)
    },

    /**
     * 重置所有句子的播放状态
     * 递归遍历支持任意层级的数据结构
     */
    resetSentenceAudioStatus() {
      const { list } = this.data
      if (!list) return

      const resetStatus = (data) => {
        return data.map(item => {
          if (item.list && item.list.length > 0) {
            return {
              ...item,
              list: resetStatus(item.list)
            }
          } else {
            return {
              ...item,
              playStatus: 'none'
            }
          }
        })
      }

      this.setData({
        list: resetStatus(list)
      })
    }
  }
})
