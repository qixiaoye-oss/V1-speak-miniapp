//需要转译音频上传地址
let uploadaudiouri = 'https://douci-video.oss-cn-beijing.aliyuncs.com/'

let url = {
  develop: 'ielts-dev',
  trial: 'ielts',
  release: 'ielts',
}
const version = wx.getAccountInfoSync().miniProgram.envVersion
let ossDir = url[version]

// 保存录音信息到缓存
async function saveRecordToCache(sentenceId, audioFilePath) {
  let records = getRecordFromCache()
  records[sentenceId] = audioFilePath;
  wx.setStorageSync('audioRecords', JSON.stringify(records));
}

// 从缓存中读取录音信息
function getRecordFromCache() {
  let storage = wx.getStorageSync('audioRecords')
  let records = {};
  if (storage) {
    records = JSON.parse(storage)
  }
  return records
}

// 验证临时文件是否存在，不存在则删除记录
function verifyAndCleanRecords() {
  const records = getRecordFromCache();
  for (const sentenceId in records) {
    const audioFilePath = records[sentenceId];
    wx.getFileSystemManager().getFileInfo({
      filePath: audioFilePath,
      error: (() => {
        delete records[sentenceId];
      })
    })
  }
  wx.setStorageSync('audioRecords', JSON.stringify(records));
}

// 保存录音信息到缓存
function delRecordToCache(sentenceId) {
  const records = getRecordFromCache();
  delete records[sentenceId];
  wx.setStorageSync('audioRecords', JSON.stringify(records));
}


// 页面加载时回填已录音的句子
function loadRecordedSentences(that) {
  verifyAndCleanRecords();
  let list = that.data.list
  const recorded = getRecordFromCache();
  list.forEach(sentence => {
    if (recorded[sentence.id]) {
      sentence.recordingUrl = recorded[sentence.id];
    }
  });
  that.setData({
    list: list
  })
}

/**
 * 上传录音文件
 */
function uploadReading(src, path, that) {
  let fileName = src.toString().replace(/^.*[\\/]/, '');
  return new Promise((resolve, reject) => {
    var realpath = ossDir + path + fileName
    wx.uploadFile({
      url: uploadaudiouri,
      filePath: src,
      name: 'file',
      formData: {
        name: src,
        key: realpath,
        policy: "eyJleHBpcmF0aW9uIjoiMjAzMC0wMS0wMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W1siY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsMTA0ODU3NjAwMF1dfQ==",
        OSSAccessKeyId: "lapsix94Pq5fbomp",
        success_action_status: "200",
        signature: "cwQtszjZEpqW1ir6v4py2Cb9NlY=",
      },
      success: function (res) {
        resolve(uploadaudiouri + realpath)
      },
      fail: function (res) {
        reject(res)
      },
    })
  })
}


/**
 * 批量上传录音文件
 */
function batchUploadReading(files, path, that) {
  const uploadTasks = files.map(file => {
    let fileName = file.url.toString().replace(/^.*[\\/]/, '');
    return new Promise((resolve, reject) => {
      var realpath = ossDir + path + fileName
      wx.uploadFile({
        url: uploadaudiouri,
        filePath: file.url,
        name: 'file',
        formData: {
          name: file.url,
          key: realpath,
          policy: "eyJleHBpcmF0aW9uIjoiMjAzMC0wMS0wMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W1siY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsMTA0ODU3NjAwMF1dfQ==",
          OSSAccessKeyId: "lapsix94Pq5fbomp",
          success_action_status: "200",
          signature: "cwQtszjZEpqW1ir6v4py2Cb9NlY=",
        },
        success: function (res) {
          file.url = uploadaudiouri + realpath
          resolve(file)
        },
        fail: function (res) {
          reject(res)
        },
      })
    });
  });
  return new Promise((resolve, reject) => {
    Promise.all(uploadTasks)
      .then(results => {
        resolve(results)
      })
      .catch(error => {
        reject(error)
      });
  })
}

/**
 * 测试
 */
function testFun() {
  return new Promise((resolve, reject) => {
    // resolve("正确")
    reject("错误")
  })
}

module.exports = {
  saveRecordToCache: saveRecordToCache,
  getRecordFromCache: getRecordFromCache,
  verifyAndCleanRecords: verifyAndCleanRecords,
  delRecordToCache: delRecordToCache,
  loadRecordedSentences: loadRecordedSentences,
  uploadReading: uploadReading,
  batchUploadReading: batchUploadReading,
  testFun: testFun
}
