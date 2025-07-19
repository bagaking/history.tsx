# History.tsx 演示项目 🚀

这是一个独立的演示项目，展示如何优雅地使用 History.tsx 的各种功能。

## 📁 项目结构

```
examples/demo/
├── src/
│   ├── main.tsx          # React 入口
│   ├── App.tsx           # 主演示界面
│   └── styles.css        # 样式文件
├── node-demo.ts          # Node.js 演示
├── universal-demo.ts     # 通用用法演示
├── package.json          # 演示项目配置
└── vite.config.ts        # Vite 配置
```

## 🎯 最佳实践设计

### ✅ 为什么这样设计示例项目

1. **完全独立** - 不影响主仓库
2. **包引用** - 使用 `file:../..` 直接引用源码
3. **现代工具链** - Vite + React 18 + TypeScript
4. **多种演示** - React Hooks + Node.js + 通用用法
5. **优雅界面** - 响应式设计，深色主题支持

### 🔧 运行方式

#### React 演示界面
```bash
cd examples/demo
npm install
npm run dev        # 启动 Vite 开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
```

#### Node.js 演示
```bash
cd examples/demo
npm run universal  # 通用用法演示
npm run node-demo  # Node.js 特定用法
```

### 📊 演示内容

1. **📝 智能文本编辑器** - 防抖、实时保存
2. **🔢 计数器** - 简化 Hook 用法
3. **✅ Todo 应用** - 分支管理、时间旅行
4. **⏰ 时间旅行** - 跳转到任意历史状态

### 🎨 设计亮点

- **优雅 UI** - 渐变背景、阴影、圆角
- **响应式** - 适配不同屏幕尺寸
- **交互反馈** - 按钮状态、加载动画
- **中文界面** - 本土化体验
- **实时反馈** - 状态变化即时可见

### 🔗 与主仓库的关系

- **零依赖** - 不修改主仓库代码
- **包引用** - 通过 `file:../..` 保持同步
- **独立发布** - 可作为独立演示站点
- **版本控制** - 跟随主仓库版本更新

## 🚀 快速开始

```bash
# 进入演示目录
cd examples/demo

# 安装依赖（会自动安装主包）
npm install

# 启动 React 演示
npm run dev

# 运行 Node.js 演示
npm run universal
```

访问 http://localhost:3000 即可看到完整演示界面！