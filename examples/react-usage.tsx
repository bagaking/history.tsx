import React, { useState } from 'react'
import { useHistory, useUndo, useHistoryState } from '@bagaking/history.tsx'

// === Basic useHistory Hook ===
function TextEditor() {
  const history = useHistory<string>({
    initialData: 'Hello World',
    debounceDelay: 500
  })

  const handleTextChange = (text: string) => {
    history.record(text)
  }

  return (
    <div>
      <h3>Text Editor with History</h3>
      <textarea
        value={history.current || ''}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Type something..."
      />
      <div>
        <button 
          onClick={history.undo}
          disabled={!history.canUndo}
        >
          Undo
        </button>
        <button 
          onClick={history.redo}
          disabled={!history.canRedo}
        >
          Redo
        </button>
        <button onClick={history.clear}>
          Clear History
        </button>
      </div>
      <div>
        <small>
          Current branch: {history.state.activeBranch} | 
          Position: {history.state.cursor + 1} / {history.state.mainBranch.entries.length}
        </small>
      </div>
    </div>
  )
}

// === Simplified useUndo Hook ===
function SimpleCounter() {
  const {
    data: count,
    record,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndo<number>({
    initialData: 0,
    onUndo: (previousValue) => {
      console.log('Undid to:', previousValue)
    },
    onRedo: (newValue) => {
      console.log('Redid to:', newValue)
    }
  })

  const increment = () => record((count || 0) + 1)
  const decrement = () => record((count || 0) - 1)

  return (
    <div>
      <h3>Counter with Undo</h3>
      <div>
        <button onClick={decrement}>-</button>
        <span style={{ margin: '0 20px', fontSize: '24px' }}>
          {count || 0}
        </span>
        <button onClick={increment}>+</button>
      </div>
      <div>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </div>
  )
}

// === Complex State Management ===
interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface TodoState {
  todos: TodoItem[]
  filter: 'all' | 'active' | 'completed'
}

function TodoApp() {
  const history = useHistory<TodoState>({
    initialData: {
      todos: [],
      filter: 'all'
    },
    debounceDelay: 200
  })

  const currentState = history.current || { todos: [], filter: 'all' as const }

  const addTodo = (text: string) => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text,
      completed: false
    }
    
    history.record({
      ...currentState,
      todos: [...currentState.todos, newTodo]
    }, {
      metadata: { action: 'add_todo', todoText: text }
    })
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
    history.record({
      ...currentState,
      filter
    }, {
      metadata: { action: 'change_filter', filter }
    })
  }

  const createBranch = () => {
    const branchName = `experiment-${Date.now()}`
    history.createBranch(branchName)
    history.switchBranch(branchName)
  }

  return (
    <div>
      <h3>Todo App with Advanced History</h3>
      
      {/* Add Todo */}
      <div>
        <input
          type="text"
          placeholder="Add a todo..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addTodo(e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
        />
      </div>

      {/* Filters */}
      <div>
        {(['all', 'active', 'completed'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setFilter(filter)}
            style={{ 
              marginRight: '10px',
              fontWeight: currentState.filter === filter ? 'bold' : 'normal'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Todos */}
      <div>
        {currentState.todos
          .filter(todo => {
            if (currentState.filter === 'active') return !todo.completed
            if (currentState.filter === 'completed') return todo.completed
            return true
          })
          .map(todo => (
            <div key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span style={{ 
                textDecoration: todo.completed ? 'line-through' : 'none' 
              }}>
                {todo.text}
              </span>
            </div>
          ))
        }
      </div>

      {/* History Controls */}
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h4>History Controls</h4>
        <button onClick={history.undo} disabled={!history.canUndo}>
          Undo
        </button>
        <button onClick={history.redo} disabled={!history.canRedo}>
          Redo
        </button>
        <button onClick={createBranch}>
          Create Experiment Branch
        </button>
        <button onClick={() => history.switchBranch('main')}>
          Back to Main
        </button>
        
        <div>
          <small>
            Branch: {history.state.activeBranch} | 
            Entries: {history.state.branches.get(history.state.activeBranch)?.entries.length || 0}
          </small>
        </div>
      </div>
    </div>
  )
}

// === History State Observer ===
function HistoryDebugger({ manager }) {
  const state = useHistoryState(manager)

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f0f0f0',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>History Debug</h4>
      <div>Current: {JSON.stringify(state.current)}</div>
      <div>Branch: {state.activeBranch}</div>
      <div>Branches: {state.branches.join(', ')}</div>
      <div>Can Undo: {state.canUndo ? 'Yes' : 'No'}</div>
      <div>Can Redo: {state.canRedo ? 'Yes' : 'No'}</div>
    </div>
  )
}

// === Time Travel Interface ===
function TimeTravel() {
  const history = useHistory<{ step: number }>({
    initialData: { step: 0 }
  })

  const [selectedHash, setSelectedHash] = useState<string>('')

  React.useEffect(() => {
    // Record some steps
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        history.record({ step: i }, { debounce: false })
      }, i * 100)
    }
  }, [])

  const allEntries = history.query(() => true)

  const jumpToEntry = (hash: string, mode: 'readonly' | 'branch') => {
    history.jumpTo(hash, { mode })
  }

  return (
    <div>
      <h3>Time Travel Interface</h3>
      <div>Current Step: {history.current?.step || 0}</div>
      
      <h4>Timeline</h4>
      {allEntries.map(entry => (
        <div key={entry.hash} style={{ margin: '5px 0' }}>
          <input
            type="radio"
            name="timeline"
            value={entry.hash}
            checked={selectedHash === entry.hash}
            onChange={() => setSelectedHash(entry.hash)}
          />
          <span>Step {entry.data.step} - {entry.timestamp.toLocaleTimeString()}</span>
          <button 
            onClick={() => jumpToEntry(entry.hash, 'readonly')}
            style={{ marginLeft: '10px' }}
          >
            View
          </button>
          <button 
            onClick={() => jumpToEntry(entry.hash, 'branch')}
            style={{ marginLeft: '5px' }}
          >
            Branch From Here
          </button>
        </div>
      ))}
    </div>
  )
}

// === Main App ===
export default function App() {
  const [activeDemo, setActiveDemo] = useState('text-editor')

  const demos = {
    'text-editor': TextEditor,
    'counter': SimpleCounter,
    'todo': TodoApp,
    'time-travel': TimeTravel
  }

  const DemoComponent = demos[activeDemo]

  return (
    <div style={{ padding: '20px' }}>
      <h1>History.tsx React Examples</h1>
      
      <div>
        {Object.keys(demos).map(demo => (
          <button
            key={demo}
            onClick={() => setActiveDemo(demo)}
            style={{
              marginRight: '10px',
              padding: '5px 10px',
              backgroundColor: activeDemo === demo ? '#007bff' : '#f8f9fa',
              color: activeDemo === demo ? 'white' : 'black',
              border: '1px solid #ccc'
            }}
          >
            {demo.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <DemoComponent />
      </div>
    </div>
  )
}