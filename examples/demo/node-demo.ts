// Node.js 环境下的演示
import { UniversalHistoryManager } from '../../dist/core/HistoryManager.js'

console.log('🚀 History.tsx Node.js 演示')
console.log('=' .repeat(50))

// 演示 1: 基础用法
function basicDemo() {
  console.log('\n📝 基础用法演示:')
  
  const history = new UniversalHistoryManager<string>()
  
  // 记录一些状态
  history.record('Hello', { debounce: false })
  history.record('Hello World', { debounce: false })
  history.record('Hello World!', { debounce: false })
  
  console.log('当前:', history.getCurrent()?.data)
  console.log('可以撤销:', history.canUndo())
  console.log('可以重做:', history.canRedo())
  
  // 撤销操作
  history.undo()
  console.log('撤销后:', history.getCurrent()?.data)
  
  // 重做操作
  history.redo()
  console.log('重做后:', history.getCurrent()?.data)
}

// 演示 2: 分支功能
function branchDemo() {
  console.log('\n🌿 分支功能演示:')
  
  const history = new UniversalHistoryManager<{ version: number, content: string }>()
  
  // 主分支
  history.record({ version: 1, content: '主分支内容' }, { debounce: false })
  history.record({ version: 2, content: '主分支更新' }, { debounce: false })
  
  // 回到第一个版本，然后记录新内容（会自动创建分支）
  history.undo()
  console.log('回到版本 1:', history.getCurrent()?.data)
  
  // 这会自动创建新分支
  history.record({ version: 3, content: '分支内容' }, { debounce: false })
  
  const state = history.getState()
  console.log('当前分支:', state.activeBranch)
  console.log('分支数量:', state.branches.size)
  console.log('当前内容:', history.getCurrent()?.data)
  
  // 切换回主分支
  history.switchBranch('main')
  console.log('切回主分支:', history.getCurrent()?.data)
}

// 演示 3: 时间旅行
function timeTravel() {
  console.log('\n⏰ 时间旅行演示:')
  
  const history = new UniversalHistoryManager<{ step: number, action: string }>()
  
  const steps = [
    { step: 1, action: '初始化项目' },
    { step: 2, action: '添加功能A' },
    { step: 3, action: '修复bug' },
    { step: 4, action: '添加功能B' },
    { step: 5, action: '优化性能' }
  ]
  
  // 记录所有步骤
  const hashes: string[] = []
  steps.forEach(step => {
    const hash = history.record(step, { 
      debounce: false,
      metadata: { timestamp: Date.now() }
    })
    hashes.push(hash)
  })
  
  console.log('所有步骤已记录，当前:', history.getCurrent()?.data)
  
  // 跳转到第2步
  history.jumpTo(hashes[1])
  console.log('跳转到第2步:', history.getCurrent()?.data)
  
  // 创建分支并继续开发
  history.jumpTo(hashes[1], { mode: 'branch', branchName: 'hotfix' })
  console.log('创建hotfix分支')
  
  history.record({ step: 6, action: '紧急修复' }, { debounce: false })
  console.log('热修复完成:', history.getCurrent()?.data)
}

// 演示 4: 查询功能
function queryDemo() {
  console.log('\n🔍 查询功能演示:')
  
  const history = new UniversalHistoryManager<{ type: string, message: string }>()
  
  const events = [
    { type: 'info', message: '系统启动' },
    { type: 'warning', message: '内存使用率高' },
    { type: 'error', message: '连接超时' },
    { type: 'info', message: '任务完成' },
    { type: 'error', message: '文件未找到' }
  ]
  
  events.forEach(event => {
    history.record(event, { 
      debounce: false,
      metadata: { timestamp: Date.now(), level: event.type }
    })
  })
  
  // 查询所有错误
  const errors = history.query(entry => entry.data.type === 'error')
  console.log('错误数量:', errors.length)
  errors.forEach(error => {
    console.log('- 错误:', error.data.message)
  })
  
  // 查询最近的事件
  const recent = history.query(entry => 
    entry.timestamp.getTime() > Date.now() - 5000
  )
  console.log('最近事件数量:', recent.length)
}

// 演示 5: 事件监听
function eventDemo() {
  console.log('\n📡 事件监听演示:')
  
  const history = new UniversalHistoryManager<number>()
  
  // 监听所有事件
  history.on(event => {
    console.log(`事件: ${event.type}, 数据: ${event.entry?.data || 'null'}`)
  })
  
  // 触发一些操作
  history.record(1, { debounce: false })
  history.record(2, { debounce: false })
  history.undo()
  history.redo()
}

// 运行所有演示
async function runAllDemos() {
  basicDemo()
  branchDemo() 
  timeTravel()
  queryDemo()
  eventDemo()
  
  console.log('\n✅ 所有演示完成!')
  console.log('💡 运行 "npm run dev" 启动 React 演示界面')
}

runAllDemos().catch(console.error)