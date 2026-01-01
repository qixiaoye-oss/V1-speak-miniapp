//普通上传地址
var uploaduri = 'https://ielts-speak.oss-cn-qingdao.aliyuncs.com'

let url = {
  // develop: 'https://local.lylo.top/api/mao',
  develop: 'https://speak.jingying.vip/api/mao',
  trial: 'http://192.168.112.227:8080/api/mao',
  release: 'https://speak.jingying.vip/api/mao',
}
const version = wx.getAccountInfoSync().miniProgram.envVersion
var uri = url[version]

function wxPromisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = function (res) {
        resolve(res) //成功
      }
      obj.fail = function (res) {
        reject(res) //失败
      }
      fn(obj)
    })
  }
}

//无论promise对象最后状态如何都会执行
Promise.prototype.finally = function (callback) {
  let P = this.constructor;
  return this.then(
    value => P.resolve(callback()).then(() => value),
    reason => P.resolve(callback()).then(() => {
      throw reason
    })
  );
};

/**
 * 微信请求方法
 * @param {Object} that 当前页面this
 * @param {string} url 请求地址
 * @param {Object} data 请求数据
 * @param {boolean} hasToast 是否需要显示toast(下拉刷新不需要toast)
 * @param {string} method GET或POST请求
 * @param {boolean} autoSetData 是否自动调用setData更新页面数据（默认true，设为false可手动控制合并多个请求的数据）
 */
function request(that, url, data, hasToast, method, autoSetData) {
  // 默认自动 setData（保持向后兼容）
  if (autoSetData === undefined) {
    autoSetData = true
  }

  let timer
  if (!hasToast) {
    timer = setTimeout(function () {
      wx.showLoading({
        title: '努力加载中...',
      })
    }, 500)  // 优化：从1000ms缩短到500ms，更快显示加载提示
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: uri + url,
      method: method || 'GET',
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Token': wx.getStorageSync("token")
      },
      success: function (res) {
        wx.hideLoading()
        if (res.data.code == '200') {
          console.log(res.data)
          // 只有 autoSetData 为 true 时才自动调用 setData
          if (autoSetData && isNotEmpty(that) && !isEmpty(that.route) && !isEmpty(res.data.data)) {
            that.setData(res.data.data)
          }
          resolve(res.data.data)
        } else {
          toast(res.data.msg || res.data.message)
          reject(res.data)
        }
      },
      fail: function (res) {
        wx.hideLoading()
        toast('请求失败，请稍候再试')
        reject(res)
      },
      complete: function (res) {
        clearTimeout(timer)
        wx.stopPullDownRefresh()
      }
    })
  })
}

/**
 * 上传文件至oss
 * @param {文件地址} filePath
 * @param {上传路径} uploadPath
 * @param {加载提示文字} loadingText
 */
function uploadFileToOSS(filePath, uploadPath, loadingText) {
  wx.showLoading({
    title: loadingText || '文件上传中...',
  })
  return new Promise((resolve, reject) => {
    // 发送请求获取签名信息
    wx.request({
      url: uri + "/system/generate/signature",
      method: 'GET',
      data: {},
      header: {
        'Content-Type': 'application/json',
        'Token': wx.getStorageSync("token")
      },
      success: function (res) {
        let imageName = filePath.toString();
        let fileName = imageName.substring(imageName.lastIndexOf('/') + 1);
        let realpath = uploadPath + fileName
        const formData = {
          key: uploadPath + fileName,  //上传文件名称
          policy: res.data.policy,   //表单域
          'x-oss-signature-version': res.data.x_oss_signature_version,    //指定签名的版本和算法
          'x-oss-credential': res.data.x_oss_credential,   //指明派生密钥的参数集
          'x-oss-date': res.data.x_oss_date,   //请求的时间
          'x-oss-signature': res.data.signature,   //签名认证描述信息
          'x-oss-security-token': res.data.security_token,  //安全令牌
          success_action_status: "200"  //上传成功后响应状态码
        };
        // 发送请求上传文件
        wx.uploadFile({
          url: uploaduri,
          filePath: filePath,
          name: 'file',   //固定值为file
          formData: formData,
          success: function (res) {
            wx.hideLoading()
            toast("上传成功", 'success', 1000)
            resolve(`${uploaduri}/${realpath}`)
          },
          fail: function (res) {
            wx.hideLoading()
            toast('上传失败', 'none', 1000)
            reject(res)
          },
        });
      },
      fail: function (res) {
        wx.hideLoading()
        toast('获取上传凭证失败', 1000)
        reject(res)
      },
    })
  })
}

/**
 * 获取系统信息
 */
function wxGetSystemInfo() {
  return wxPromisify(wx.getSystemInfo)
}

/**
 * 获取系统设置信息
 */
function wxGetSetting() {
  return wxPromisify(wx.getSetting)
}

/**
 * json转get请求参数
 */
function parseParams(json) {
  try {
    var tempArr = []
    for (var key in json) {
      tempArr.push(key + '=' + json[key])
    }
    var urlParamsStr = tempArr.join('&')
    return '?' + urlParamsStr
  } catch (err) {
    return ''
  }
}

/**
 * 微信分享
 */
function share(title, that, imgUrl) {
  let pararm = {
    ...that.options,
    "openType": "share"
  }
  return {
    title: decodeURIComponent(title),
    path: that.route + parseParams(pararm),
    imageUrl: imgUrl
  }
}

/**
 * 用于判断空，Undefined String Array Object
 */
function isEmpty(str) {
  if (Object.prototype.toString.call(str) === '[object Undefined]') { //空
    return true
  } else if (
    Object.prototype.toString.call(str) === '[object String]' ||
    Object.prototype.toString.call(str) === '[object Array]') { //字条串或数组
    return str.length == 0 ? true : false
  } else if (Object.prototype.toString.call(str) === '[object Object]') {
    return Object.getOwnPropertyNames(str).length === 0;
  } else if (Object.prototype.toString.call(str) === '[object Number]') {
    return false
  } else if (Object.prototype.toString.call(str) === '[object Boolean]') {
    return str
  } else {
    return true
  }
}

/**
 * 非空判断
 */
function isNotEmpty(str) {
  return !isEmpty(str)
}

/**
 * 弹窗(无需点击)
 */
function toast(title, icon, duration) {
  wx.showToast({
    title: title,
    icon: isEmpty(icon) ? 'none' : icon,
    duration: isEmpty(duration) ? 2000 : duration,
    mask: true
  })
}

/**
 * 弹窗(需要点击)
 */
function modal(title, content, cancel) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: title,
      content: content,
      showCancel: isEmpty(cancel) ? true : cancel,
      success(res) {
        if (res.confirm) {
          resolve(true)
        } else if (res.cancel) {
          reject(false)
        }
      }
    })
  })
}

/**
 * 格式化时间
 */
function formatTime(date, option) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = function () {
    return date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  }
  var minute = function () {
    return date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  }
  var second = function () {
    return date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  }
  if (option == 'YY-MM-DD') return " " + year + "-" + month + "-" + day; //获取年月日
  if (option == 'YY-MM') return " " + year + "-" + month; //获取年月
  if (option == 'YY') return " " + year; //获取年
  if (option == 'MM') return " " + month; //获取月
  if (option == 'DD') return " " + day; //获取日
  if (option == 'yesterday') return " " + day - 1; //获取昨天
  if (option == 'hh-mm-ss') return " " + hour() + ":" + minute() + ":" + second(); //获取时分秒
  if (option == 'hh-mm') return " " + hour() + ":" + minute(); //获取时分
  if (option == 'mm-ss') return minute() + ":" + second(); //获取分秒
  if (option == 'mm') return minute(); //获取分
  if (option == 'ss') return second(); //获取秒
  return year + '-' + month + '-' + day + ' ' + hour() + ':' + minute() + ":" + second(); //默认时分秒年月日
}

/**
 * 格式化时间
 */
function dateformat(second) {
  second = parseInt(second);
  var min = Math.floor(second / 60);
  var sec = (second - min * 60);
  return (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}


/**
 * 格式化时间
 */
function formatTimeBySecond(second) {
  second = parseInt(second)
  var hour = Math.floor(second / 3600)
  var min = Math.floor((second - hour * 3600) / 60)
  var sec = second - hour * 3600 - min * 60
  return (hour < 10 ? "0" + hour : hour) + ":" + (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec)
}

function initAudio(src) {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '音频准备中...',
      mask: true
    })
    const audio = wx.createInnerAudioContext()
    let timer
    audio.onCanplay(() => {
      wx.hideLoading()
      clearTimeout(timer)
      resolve(audio)
    })
    audio.onError(() => {
      wx.hideLoading()
      clearTimeout(timer)
      resolve(audio)
      modal("", "本模块电脑版播放功能需要等待微信官方更新，目前手机/平板可以正常播放。", false)
    })
    wx.downloadFile({
      url: src,
      success: ({
        tempFilePath,
        statusCode
      }) => {
        if (statusCode === 200) {
          audio.src = tempFilePath
          wx.setStorageSync('tempAudioUrl', tempFilePath)
          resolve(audio)
        }
      },
      fail(res) {
        console.log(res);
      }
    })
  })
}

function delAudioFile() {
  let tempUrl = wx.getStorageSync('tempAudioUrl')
  wx.getFileSystemManager().removeSavedFile({
    filePath: tempUrl
  })
  wx.removeStorageSync('tempAudioUrl')
}

function formatAudioTime(val) {
  let nval = Number(val).toFixed(3)
  return Number(nval)
}

function audioErr(err, url) {
  wx.getSystemInfo({
    success(res) {
      console.log(res);
      wx.request({
        url: uri + '/user/addLog',
        method: "POST",
        data: {
          audioUrl: url,
          logContent: JSON.stringify(err),
          brand: res.brand,
          model: res.model,
          version: res.version,
          system: res.system,
          platform: res.platform,
          sdkversion: res.SDKVersion
        },
        header: {
          'Content-Type': 'application/json'
        },
      })
    }
  })
}

function recorderErr(model, log) {
  wx.getSystemInfo({
    success(res) {
      console.log(res);
      wx.request({
        url: uri + '/user/recorder/log',
        method: "POST",
        data: {
          module: model,
          logContent: JSON.stringify(log),
          brand: res.brand,
          model: res.model,
          version: res.version,
          system: res.system,
          platform: res.platform,
          sdkversion: res.SDKVersion
        },
        header: {
          'Content-Type': 'application/json'
        },
      })
    }
  })
}

/**
 * 录音权限验证
 */
function verifyRecordingPermission() {
  wx.getSetting({
    success(res) {
      if (!res.authSetting['scope.record']) {
        wx.authorize({
          scope: 'scope.record',
          success() { },
          fail() {
            toast("未开启麦克风权限无法进行录音")
            setTimeout(() => {
              wx.navigateBack()
            }, 2000)
          }
        })
      }
    }
  })
}

module.exports = {
  wxPromisify: wxPromisify,
  wxGetSystemInfo: wxGetSystemInfo,
  wxGetSetting: wxGetSetting,
  request: request,
  isEmpty: isEmpty,
  isNotEmpty: isNotEmpty,
  uploadFileToOSS: uploadFileToOSS,
  toast: toast,
  modal: modal,
  parseParams: parseParams,
  share: share,
  formatTime: formatTime,
  dateformat: dateformat,
  formatTimeBySecond: formatTimeBySecond,
  initAudio: initAudio,
  delAudioFile: delAudioFile,
  formatAudioTime: formatAudioTime,
  audioErr: audioErr,
  recorderErr: recorderErr,
  verifyRecordingPermission: verifyRecordingPermission
}