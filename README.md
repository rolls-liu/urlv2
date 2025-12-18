# 推流地址生成器

一个功能完整的推流/播放地址生成器，支持多种协议和加密方式，具有服务端数据持久化和历史记录功能。

## 功能特性

### 🚀 协议支持
- **RTMP** - 实时消息传输协议
- **WebRTC** - Web实时通信协议
- **SRT** - 安全可靠传输协议
- **RTMP over SRT** - 基于SRT的RTMP传输
- **RTMP over QUIC** - 基于QUIC的RTMP传输

### 🔐 加密支持
- **MD5** 加密
- **SHA256** 加密

### 💾 数据功能
- 服务端数据持久化（SQLite）
- 自动保存最后一次配置
- 历史记录存储（最多100条）
- 一键复制推流/播放地址
- 清空输入功能

### 📱 用户体验
- 响应式设计，支持移动端
- 现代化UI界面
- 实时表单验证
- 详细的使用说明

## 安装和运行

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖
```bash
# 安装前端和后端依赖
npm run install:all
```

### 启动开发服务器
```bash
# 同时启动前端和后端
npm start
```

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

### 单独启动
```bash
# 仅启动前端
npm run client

# 仅启动后端
npm run server
```

### 构建生产版本
```bash
npm run build
```

## 使用说明

### 基本使用
1. 选择协议类型（RTMP、WebRTC、SRT等）
2. 选择加密方式（MD5或SHA256）
3. 填写推流域名、AppName、StreamName
4. （可选）设置密钥和过期时间
5. 点击"生成推流地址"按钮
6. 复制生成的推流地址使用

### 鉴权说明
- 如果不需要鉴权，密钥和过期时间可以为空
- 如果需要鉴权，密钥和过期时间必须同时设置
- 过期时间使用UTC时间，格式：YYYY-MM-DD HH:MM:SS

### 历史记录
- 每次生成地址都会自动保存到历史记录
- 可以查看、复制、删除历史记录
- 支持批量清空所有记录
- 历史记录存储在服务端数据库中，清除浏览器缓存不会丢失

## 推流地址格式

### RTMP
```
rtmp://域名/AppName/StreamName?txSecret=加密值&txTime=时间戳
```

### WebRTC
```
webrtc://域名/AppName/StreamName?txSecret=加密值&txTime=时间戳
```

### SRT
```
srt://域名:9000?streamid=#!::h=域名,r=AppName/StreamName,txSecret=加密值,txTime=时间戳
```

### RTMP over SRT
```
rtmp://域名:3570/AppName/StreamName?txSecret=加密值&txTime=时间戳
```

### RTMP over QUIC
```
rtmp://域名:443/AppName/StreamName?txSecret=加密值&txTime=时间戳
```

## 技术栈

### 前端
- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **CryptoJS** - 加密算法
- **Day.js** - 时间处理

### 后端
- **Express** - Web 服务框架
- **sql.js** - 纯 JavaScript SQLite 实现
- **CORS** - 跨域支持

## 项目结构

```
├── server/              # 后端服务
│   ├── index.js         # Express 服务入口
│   └── package.json     # 后端依赖
├── src/
│   ├── components/      # 组件目录
│   │   ├── StreamUrlGenerator.tsx  # 推流地址生成器
│   │   ├── PlayUrlGenerator.tsx    # 播放地址生成器
│   │   └── HistoryPanel.tsx        # 历史记录组件
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   ├── urlGenerator.ts  # 地址生成逻辑
│   │   ├── storage.ts       # 存储管理
│   │   └── api.ts           # API 请求封装
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 应用样式
│   ├── index.tsx        # 应用入口
│   └── index.css        # 全局样式
├── package.json         # 前端依赖和脚本
└── README.md
```

## 开发说明

### 添加新协议
1. 在 `src/types/index.ts` 中添加新的协议类型
2. 在 `src/utils/urlGenerator.ts` 中添加对应的生成逻辑
3. 在组件中添加协议选项

### 自定义样式
- 主要样式在 `src/App.css` 中
- 全局样式在 `src/index.css` 中
- 使用Ant Design主题定制

## 部署说明

### 生产环境部署
1. 构建前端：`npm run build`
2. 将 `build` 目录复制到 `server/build`
3. 在服务器上安装后端依赖：`cd server && npm install`
4. 启动服务：`node index.js`
5. 服务默认运行在 3001 端口，同时提供前端静态文件和 API 服务

### API 端点
- `GET/POST /api/stream/config` - 推流配置
- `GET/POST/DELETE /api/stream/history` - 推流历史
- `GET/POST /api/play/config` - 播放配置
- `GET/POST/DELETE /api/play/history` - 播放历史

## 许可证

MIT License