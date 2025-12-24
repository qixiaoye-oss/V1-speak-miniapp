# 已移除功能记录 (2025-12-05)

本文档记录了 2025年12月5日 进行的代码清理工作，移除了暂时不用的页面和功能。

> **后端参考**: 本文档包含各功能使用的 API 接口信息，供后端团队进行相应清理时参考。

## 移除概览

| 类别 | 移除项目数 | 删除文件数 | 减少代码行数 | 涉及API数 |
|------|-----------|-----------|-------------|----------|
| 视频功能 | 3个页面 | 12个文件 | ~600行 | 待确认 |
| 练习功能 | 4个页面 | 16个文件 | ~1100行 | 2个 |
| 随机练习功能 | 2个页面 | 8个文件 | ~500行 | 3个 |
| P1/P2练习录音 | 4个页面 | 16个文件 | ~1660行 | 6个 |
| 素材块训练功能 | 4个页面 | 16个文件 | ~1140行 | 6个 |
| **合计** | **17个页面** | **68个文件** | **~5000行** | **17个+** |

---

## 1. 视频功能 (pages/video)

### 移除的目录
```
pages/video/
├── set-list/          # 视频集列表
├── video-list/        # 视频列表
└── video-detail/      # 视频详情
```

### 移除的引用
- `app.json`: 移除3个页面注册
- `app.json`: 移除 t-video 插件配置
- `pages/home/home.js`: 移除 VIDEO 路由映射

### 原功能说明
视频学习功能，用户可以浏览视频集、查看视频列表、播放视频详情。

### 后端相关 (待确认)
```
相关 API 接口未能从 git 历史中检索到。
建议后端检查以下可能的接口路径：
- /video/* 相关接口
- t-video 插件相关配置
```

---

## 2. 练习功能 (pages/practice)

### 移除的目录
```
pages/practice/
├── set-list/          # 练习集列表
├── menu-list/         # 练习菜单
├── recording/         # 练习录音
└── record_detail/     # 练习记录详情
```

### 移除的引用
- `app.json`: 移除4个页面注册
- `pages/home/home.js`: 移除 BASIC 路由映射

### 原功能说明
基础练习功能，提供练习集浏览、练习菜单、录音练习和记录查看。

### 后端相关 API

| API 路径 | 请求方式 | 用途 | 页面 |
|---------|---------|------|------|
| `/practice/v2/list` | GET | 获取练习集列表 | set-list |
| `/practice/list` | GET | 获取练习菜单列表 | menu-list |

**涉及数据表 (推测)**:
- practice 相关表
- 用户练习记录表

---

## 3. P3随机练习功能 (pages/random-practice)

### 移除的目录
```
pages/random-practice/
├── history-p3/        # P3随机练习历史
└── practice-p3/       # P3随机练习
```

### 移除的引用
- `app.json`: 移除2个页面注册
- `pages/question/set_p2p3_list/index.js`: 移除 randomPractice 函数
- `pages/question/set_p2p3_list/index.wxml`: 移除"P3随机练"按钮
- `pages/question/set_p2p3_list/index.wxss`: 移除 .random-practice 样式

### 原功能说明
P3部分的随机练习功能，用户可以随机抽取P3题目进行练习。

### 后端相关 API

| API 路径 | 请求方式 | 用途 | 页面 |
|---------|---------|------|------|
| `/question/v2/p3/practice/random` | GET | 获取随机P3题目 | practice-p3 |
| `/question/v2/p3/practice/random/record` | GET | 获取P3随机练习历史记录 | history-p3 |
| `/recording/save2Continuous` | POST | 保存连续录音记录 | practice-p3 |

**文件上传接口**:
| 上传路径 | 用途 |
|---------|------|
| `/oral/continuousRecording/` | 上传连续录音文件 |

**涉及数据表 (推测)**:
- p3 随机练习记录表
- continuous_recording 相关表

---

## 4. P1/P2练习录音功能 (pages/question/recording-*)

### 移除的目录
```
pages/question/
├── recording-p1/           # P1练习录音
├── recording-p1-record/    # P1练习录音记录
├── recording-p2/           # P2练习录音
└── recording-p2-record/    # P2练习录音记录
```

### 移除的引用
- `app.json`: 移除4个页面注册
- `pages/question/question_p1_detail/index.js`: 移除练习菜单入口代码
- `pages/question/question_p2_detail/index.js`: 移除练习菜单入口代码

### 原功能说明
P1/P2问题详情页中的"练习"功能，用户可以针对特定答案进行录音练习。
该功能已被 `pages/recording` 目录下的录音功能替代。

### 后端相关 API

**P1 练习录音相关**:

| API 路径 | 请求方式 | 用途 | 页面 |
|---------|---------|------|------|
| `/question/v2/p1/practice/recording/detail` | GET | 获取P1练习录音详情 | recording-p1 |
| `/v2/question/p1/practice/save` | POST | 保存P1练习录音 | recording-p1 |
| `/v2/question/p1/practice/record` | GET | 获取P1练习录音记录列表 | recording-p1-record |

**P2 练习录音相关**:

| API 路径 | 请求方式 | 用途 | 页面 |
|---------|---------|------|------|
| `/question/v3/p2/practice/detail` | GET | 获取P2练习录音详情 | recording-p2 |
| `/v2/question/p2/practice/save` | POST | 保存P2练习录音 | recording-p2 |
| `/v2/question/p2/practice/record` | GET | 获取P2练习录音记录列表 | recording-p2-record |

**涉及数据表 (推测)**:
- question_p1_practice 相关表
- question_p2_practice 相关表
- 用户练习录音记录表

---

## 5. 素材块训练功能 (pages/p2_block & pages/p3_block)

### 移除的目录
```
pages/p2_block/
├── recording/         # P2素材块录音训练 (recording.js)
└── record_detail/     # P2素材块训练记录 (record_detail.js)

pages/p3_block/
├── recording/         # P3素材块录音训练 (recording.js)
└── record_detail/     # P3素材块训练记录 (record_detail.js)
```

### 移除的引用
- `app.json`: 移除4个页面注册
- `pages/p2_block/block_detail/index.js`: 移除 punching 函数
- `pages/p3_block/block_detail/index.js`: 移除 punching 和 toPracticePage 函数

### 功能替代
- `pages/p2_block/block_detail`: 底部按钮改为"返回"按钮
- `pages/p3_block/block_detail`: 底部按钮改为"返回"按钮

### 原功能说明
P2/P3素材块详情页中的"训练"功能，用户可以对素材块内容进行录音训练。

### 后端相关 API

**P2 素材块 (故事块) 相关**:

| API 路径 | 请求方式 | 用途 | 页面 |
|---------|---------|------|------|
| `/story/listPracticeData` | GET | 获取P2素材块练习数据 | recording |
| `/story/savePracticeData` | POST | 保存P2素材块练习数据 | recording |
| `/story/getPracticeRecord` | GET | 获取P2素材块练习记录 | record_detail |

**P3 素材块 (四分块) 相关**:

| API 路径 | 请求方式 | 用途 | 页面 |
|---------|---------|------|------|
| `/material/v2/practice/list` | GET | 获取P3素材块练习列表 | recording |
| `/material/savePracticeData` | POST | 保存P3素材块练习数据 | recording |
| `/material/v2/practice/listRecord` | GET | 获取P3素材块练习记录列表 | record_detail |

**涉及数据表 (推测)**:
- story_practice 相关表 (P2素材块)
- material_practice 相关表 (P3素材块)

---

## 后端清理汇总

### 可移除的 API 接口清单

```
# 练习功能
/practice/v2/list
/practice/list

# P3随机练习功能
/question/v2/p3/practice/random
/question/v2/p3/practice/random/record
/recording/save2Continuous
/oral/continuousRecording/ (文件上传)

# P1练习录音功能
/question/v2/p1/practice/recording/detail
/v2/question/p1/practice/save
/v2/question/p1/practice/record

# P2练习录音功能
/question/v3/p2/practice/detail
/v2/question/p2/practice/save
/v2/question/p2/practice/record

# P2素材块训练功能
/story/listPracticeData
/story/savePracticeData
/story/getPracticeRecord

# P3素材块训练功能
/material/v2/practice/list
/material/savePracticeData
/material/v2/practice/listRecord
```

### 可能涉及的数据表

| 功能模块 | 可能的表名/前缀 |
|---------|---------------|
| 练习功能 | practice_* |
| P3随机练习 | continuous_recording_*, p3_random_* |
| P1/P2练习录音 | question_p1_practice_*, question_p2_practice_* |
| P2素材块训练 | story_practice_* |
| P3素材块训练 | material_practice_* |

### 注意事项

1. **视频功能**: API 信息未能完全检索，建议后端团队检查 `/video/*` 相关接口
2. **文件存储**: 检查 OSS/文件存储中 `/oral/continuousRecording/` 路径下的历史文件
3. **录音文件**: 移除功能产生的录音文件可考虑归档或清理
4. **数据保留**: 建议先软删除/归档数据，确认无影响后再进行物理删除

---

## 相关重命名

### 1. pages/recording 目录重命名

在本次清理中，对 `pages/recording` 目录进行了重命名以符合功能语义：

| 原目录名 | 新目录名 | 说明 |
|---------|---------|------|
| record_answer_p3 | p3_record | P3录音 |
| record | p2_record | P2录音 |
| questions_recording | p1_multirecord | P1多题录音 |
| questions_record_list | p1_multirecord_list | P1多题录音列表 |
| questions_record_detail | history_record_detail | 历史录音详情 |
| list | p2p3_record_list | P2/P3录音列表 |

### 2. pages/p2_block & pages/p3_block 目录重命名

将目录名中的连字符改为下划线：

| 原目录名 | 新目录名 |
|---------|---------|
| pages/p2-block | pages/p2_block |
| pages/p2-block/block-detail | pages/p2_block/block_detail |
| pages/p2-block/block-group | pages/p2_block/block_group |
| pages/p2-block/set-list | pages/p2_block/set_list |
| pages/p3-block | pages/p3_block |
| pages/p3-block/block-detail | pages/p3_block/block_detail |
| pages/p3-block/block-group | pages/p3_block/block_group |
| pages/p3-block/link-question | pages/p3_block/link_question |
| pages/p3-block/set-list | pages/p3_block/set_list |

### 3. pages/question 目录重命名

将目录名中的连字符改为下划线：

| 原目录名 | 新目录名 |
|---------|---------|
| pages/question/question-p1-detail | pages/question/question_p1_detail |
| pages/question/question-p1-list | pages/question/question_p1_list |
| pages/question/question-p2-detail | pages/question/question_p2_detail |
| pages/question/question-p3-detail | pages/question/question_p3_detail |
| pages/question/question-p3-list | pages/question/question_p3_list |
| pages/question/set-p1-list | pages/question/set_p1_list |
| pages/question/set-p2p3-list | pages/question/set_p2p3_list |

---

## 恢复说明

如需恢复以上功能，可通过 Git 历史记录找回：

```bash
# 查看移除前的提交
git log --oneline

# 关键提交节点
# 82fc023 - 移除 video, practice, random-practice
# 398e6e4 - 移除 question/recording-*
# 8cedb9b - 移除 p2-block, p3-block 训练功能

# 恢复特定目录示例
git checkout 82fc023^ -- pages/video/
git checkout 398e6e4^ -- pages/question/recording-p1/
git checkout 8cedb9b^ -- pages/p2_block/recording/
```

---

## 更新日志

- **2025-12-05 v1.2**: 更新目录名称（连字符改为下划线），添加 p2_block、p3_block、question 目录重命名记录
- **2025-12-05 v1.1**: 添加后端 API 接口清单和数据表信息
- **2025-12-05 v1.0**: 初始文档创建，记录本次代码清理工作
