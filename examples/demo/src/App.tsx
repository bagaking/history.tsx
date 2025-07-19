import React, { useState } from 'react'
import { useHistory, useUndo } from '@bagaking/history.tsx'

// 样式组件
const Container = ({ children, title }: { children: React.ReactNode, title: string }) => (
  <div style={{ 
    background: 'white', 
    padding: '20px', 
    margin: '20px', 
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }}>
    <h2 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
      {title}
    </h2>
    {children}
  </div>
)

const Button = ({ onClick, disabled, children, variant = 'primary' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '8px 16px',
      margin: '0 8px 8px 0',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      backgroundColor: disabled ? '#ccc' : variant === 'primary' ? '#007bff' : '#28a745',
      color: 'white',
      opacity: disabled ? 0.6 : 1
    }}
  >
    {children}
  </button>
)

// Demo 1: 文本编辑器
function TextEditorDemo() {
  const history = useHistory<string>({
    initialData: '欢迎使用 History.tsx！\n\n这是一个强大的 undo/redo 系统。',
    debounceDelay: 1000
  })

  return (
    <Container title="📝 智能文本编辑器 (带防抖)">
      <div style={{ marginBottom: '10px' }}>
        <Button onClick={history.undo} disabled={!history.canUndo}>
          ⟲ 撤销
        </Button>
        <Button onClick={history.redo} disabled={!history.canRedo}>
          ⟳ 重做
        </Button>
        <Button onClick={history.clear} variant="secondary">
          🗑️ 清空历史
        </Button>
      </div>
      
      <textarea
        value={history.current || ''}
        onChange={(e) => history.record(e.target.value)}
        placeholder="开始输入... (1秒后自动保存)"
        style={{
          width: '100%',
          height: '120px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}
      />
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>当前分支:</strong> {history.state.activeBranch} | 
        <strong> 历史条目:</strong> {history.state.branches.get(history.state.activeBranch)?.entries.length || 0} |
        <strong> 位置:</strong> {history.state.cursor + 1}
      </div>
    </Container>
  )
}

// Demo 2: 计数器
function CounterDemo() {
  const {
    data: count,
    record,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndo<number>({ initialData: 0 })

  const increment = () => record((count || 0) + 1)
  const decrement = () => record((count || 0) - 1)
  const reset = () => record(0)

  return (
    <Container title="🔢 计数器 (简化版 Hook)">
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#333' }}>
          {count || 0}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <Button onClick={decrement}>➖ 减少</Button>
        <Button onClick={increment}>➕ 增加</Button>
        <Button onClick={reset} variant="secondary">🔄 重置</Button>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <Button onClick={undo} disabled={!canUndo}>⟲ 撤销</Button>
        <Button onClick={redo} disabled={!canRedo}>⟳ 重做</Button>
      </div>
    </Container>
  )
}

// Demo 3: Todo 应用
interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface TodoState {
  todos: TodoItem[]
  filter: 'all' | 'active' | 'completed'
}

function TodoDemo() {
  const history = useHistory<TodoState>({
    initialData: { todos: [], filter: 'all' as const },
    debounceDelay: 200
  })
  
  const [inputText, setInputText] = useState('')
  const currentState = history.current || { todos: [], filter: 'all' as const }

  const addTodo = () => {
    if (!inputText.trim()) return
    
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      completed: false
    }
    
    history.record({
      ...currentState,
      todos: [...currentState.todos, newTodo]
    }, {
      metadata: { action: 'add_todo', todoText: inputText.trim() }
    })
    
    setInputText('')
  }

  const toggleTodo = (id: string) => {
    const updatedTodos = currentState.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    
    history.record({
      ...currentState,
      todos: updatedTodos
    }, {
      metadata: { action: 'toggle_todo', todoId: id }
    })
  }

  const setFilter = (filter: TodoState['filter']) => {
    history.record({ ...currentState, filter })
  }

  const createBranch = () => {
    const branchName = `实验分支-${Date.now()}`
    history.createBranch(branchName)
    history.switchBranch(branchName)
  }

  const filteredTodos = currentState.todos.filter(todo => {
    if (currentState.filter === 'active') return !todo.completed
    if (currentState.filter === 'completed') return todo.completed
    return true
  })

  return (
    <Container title="✅ Todo 应用 (高级分支功能)">
      {/* 添加新任务 */}
      <div style={{ marginBottom: '15px', display: 'flex' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <Button onClick={addTodo} style={{ marginLeft: '8px' }}>
          ➕ 添加
        </Button>
      </div>

      {/* 过滤器 */}
      <div style={{ marginBottom: '15px' }}>
        {(['all', 'active', 'completed'] as const).map(filter => (
          <Button
            key={filter}
            onClick={() => setFilter(filter)}
            variant={currentState.filter === filter ? 'primary' : 'secondary'}
          >
            {filter === 'all' ? '全部' : filter === 'active' ? '进行中' : '已完成'}
          </Button>
        ))}
      </div>

      {/* 任务列表 */}
      <div style={{ marginBottom: '15px', minHeight: '100px' }}>
        {filteredTodos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            {currentState.filter === 'all' ? '还没有任务，添加一个吧！' : `没有${currentState.filter === 'active' ? '进行中' : '已完成'}的任务`}
          </div>
        ) : (
          filteredTodos.map(todo => (
            <div key={todo.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '8px',
              borderBottom: '1px solid #eee'
            }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                style={{ marginRight: '10px' }}
              />
              <span style={{ 
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? '#666' : '#333'
              }}>
                {todo.text}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 历史控制 */}
      <div style={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px', 
        padding: '10px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <Button onClick={history.undo} disabled={!history.canUndo}>⟲ 撤销</Button>
          <Button onClick={history.redo} disabled={!history.canRedo}>⟳ 重做</Button>
          <Button onClick={createBranch} variant="secondary">🌿 创建实验分支</Button>
          <Button onClick={() => history.switchBranch('main')} variant="secondary">🏠 回到主分支</Button>
        </div>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>当前分支:</strong> {history.state.activeBranch} | 
          <strong> 任务数:</strong> {currentState.todos.length} | 
          <strong> 历史条目:</strong> {history.state.branches.get(history.state.activeBranch)?.entries.length || 0}
        </div>
      </div>
    </Container>
  )
}

// Demo 4: 时间旅行界面
function TimelineDemo() {
  const history = useHistory<{ step: number, description: string }>({
    initialData: { step: 0, description: '初始状态' }
  })

  const addStep = () => {
    const current = history.current || { step: 0, description: '' }
    const newStep = current.step + 1
    history.record({ 
      step: newStep, 
      description: `第 ${newStep} 步操作` 
    }, { 
      debounce: false,
      metadata: { timestamp: Date.now() }
    })
  }

  const allEntries = history.query(() => true)

  const jumpToEntry = (hash: string, mode: 'readonly' | 'branch') => {
    history.jumpTo(hash, { mode })
  }

  return (
    <Container title="⏰ 时间旅行界面">
      <div style={{ marginBottom: '15px' }}>
        <Button onClick={addStep}>➕ 添加步骤</Button>
        <span style={{ marginLeft: '15px', fontSize: '18px', fontWeight: 'bold' }}>
          当前: {history.current?.description || '无'}
        </span>
      </div>

      <div style={{ 
        maxHeight: '200px', 
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>历史时间线</h4>
        {allEntries.map((entry, index) => (
          <div key={entry.hash} style={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: '5px',
            backgroundColor: history.state.current?.hash === entry.hash ? '#e3f2fd' : 'transparent',
            borderRadius: '3px',
            marginBottom: '5px'
          }}>
            <span style={{ flex: 1, fontSize: '14px' }}>
              {index + 1}. {entry.data.description} 
              <small style={{ color: '#666' }}>
                ({entry.timestamp.toLocaleTimeString()})
              </small>
            </span>
            <Button 
              onClick={() => jumpToEntry(entry.hash, 'readonly')}
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              👁️ 查看
            </Button>
            <Button 
              onClick={() => jumpToEntry(entry.hash, 'branch')}
              style={{ padding: '4px 8px', fontSize: '12px' }}
              variant="secondary"
            >
              🌿 分支
            </Button>
          </div>
        ))}
      </div>
    </Container>
  )
}

// 主应用
export default function App() {
  const [activeDemo, setActiveDemo] = useState('text-editor')

  const demos = {
    'text-editor': { component: TextEditorDemo, name: '📝 文本编辑器' },
    'counter': { component: CounterDemo, name: '🔢 计数器' },
    'todo': { component: TodoDemo, name: '✅ Todo应用' },
    'timeline': { component: TimelineDemo, name: '⏰ 时间旅行' }
  }

  const DemoComponent = demos[activeDemo as keyof typeof demos].component

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 头部 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
          History.tsx 🚀
        </h1>
        <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
          优雅的 TypeScript undo/redo 管理系统 - 支持分支、时间旅行和 React 集成
        </p>
      </div>

      {/* 导航 */}
      <div style={{ 
        background: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        textAlign: 'center'
      }}>
        {Object.entries(demos).map(([key, demo]) => (
          <button
            key={key}
            onClick={() => setActiveDemo(key)}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              border: '2px solid #007bff',
              borderRadius: '25px',
              cursor: 'pointer',
              backgroundColor: activeDemo === key ? '#007bff' : 'white',
              color: activeDemo === key ? 'white' : '#007bff',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {demo.name}
          </button>
        ))}
      </div>

      {/* 演示内容 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <DemoComponent />
      </div>

      {/* 底部 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px',
        color: '#666',
        borderTop: '1px solid #e0e0e0',
        marginTop: '40px'
      }}>
        <p>
          Built with ❤️ using <strong>History.tsx</strong> | 
          <a href="https://github.com/bagaking/history.tsx" style={{ color: '#007bff', textDecoration: 'none' }}>
            GitHub
          </a>
        </p>
      </div>
    </div>
  )
}