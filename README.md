# 治疗师治疗记录系统

一个专业、可靠的治疗记录管理系统，为治疗师提供完整的治疗记录解决方案。

## 技术栈

- **前端框架**: React 18+
- **开发语言**: TypeScript 5+
- **构建工具**: Vite 5+
- **路由管理**: React Router 6+
- **状态管理**: Zustand 4+
- **UI组件库**: Shadcn/UI
- **样式系统**: Tailwind CSS 3+

## 项目结构

```
therapy-record-system/
├── src/
│   ├── components/       # UI组件
│   │   ├── layout/      # 布局组件
│   │   └── ui/          # Shadcn/UI组件
│   ├── pages/           # 页面组件
│   ├── stores/          # Zustand状态管理
│   ├── hooks/           # 自定义hooks
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript类型定义
│   ├── api/             # API调用
│   └── styles/          # 样式文件
├── public/              # 静态资源
└── ...config files
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 主要功能

- **用户认证**: 注册、登录、权限管理
- **患者管理**: 患者信息录入、检索、档案管理
- **治疗记录**: 文字、照片、视频等多种记录方式
- **拍照水印**: 自动添加时间、地点、治疗师信息等防伪元素
- **真实性证明**: 数字签名、时间戳、地理定位验证
- **统计分析**: 数据可视化、报表生成、智能分析

## 开发计划

- [ ] 完善用户认证系统
- [ ] 实现拍照水印功能
- [ ] 集成地理定位服务
- [ ] 开发统计图表
- [ ] 移动端适配优化

## 许可证

MIT License