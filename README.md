# History.tsx

<p align="center">
  <strong>Universal undo/redo management for TypeScript applications</strong>
</p>

<p align="center">
  <em>优雅、高性能的历史状态管理，支持分支、时间旅行和 React 集成</em>
</p>

## Features ✨

- **🌍 Universal**: Works in browser and Node.js environments
- **⚛️ React Ready**: Dedicated hooks for React integration
- **🌿 Branching**: Auto-branching when inserting mid-history
- **🎯 Time Travel**: Jump to any point in history with hash-based navigation
- **⚡ Debounce**: Built-in debouncing for rapid changes
- **🏷️ Metadata**: Rich metadata support for each history entry
- **🔍 Query**: Powerful querying capabilities
- **📡 Events**: Real-time event notifications
- **🎛️ Configurable**: Flexible configuration options
- **📦 TypeScript**: TypeScript declarations and type inference

## Quick Start 🚀

### Installation

```bash
npm install @bagaking/history.tsx
```

### Try Demo

```bash
npm run demo
```

## Development

```bash
npx --yes pnpm@7 install --frozen-lockfile
npx --yes pnpm@7 run validate
npx --yes pnpm@7 run build
```

CI uses pnpm 7, and the lockfile is pinned to pnpm 7's lockfile format. Use
`pnpm@7` for frozen-lockfile installs; newer pnpm major versions may reject the
lockfile. `pnpm run validate` runs linting, type checks, tests, the workspace
root package-entry smoke, and a packed tarball consumer smoke. `pnpm run build`
verifies the distributable TypeScript output.

### Basic Usage

```typescript
import { UniversalHistoryManager } from '@bagaking/history.tsx'

// Create history manager
const history = new UniversalHistoryManager<string>()

// Record states
history.record('Hello')
history.record('Hello World')
history.record('Hello World!')

// Undo/Redo
history.undo()  // Back to 'Hello World'
history.redo()  // Forward to 'Hello World!'

// Time travel
const entries = history.query(() => true)
history.jumpTo(entries[0].hash)  // Jump to first entry
```

### React Integration

```tsx
import { useHistory, useUndo } from '@bagaking/history.tsx'

function TextEditor() {
  const history = useHistory<string>({
    initialData: 'Hello World',
    debounceDelay: 500
  })

  return (
    <div>
      <textarea
        value={history.current || ''}
        onChange={(e) => history.record(e.target.value)}
      />
      <button onClick={history.undo} disabled={!history.canUndo}>
        Undo
      </button>
      <button onClick={history.redo} disabled={!history.canRedo}>
        Redo
      </button>
    </div>
  )
}
```

## Core Concepts 🧠

### History Structure

```
Main Branch:      [A] → [B] → [C] → [D]
                              ↓
Feature Branch:            [C'] → [D'] → [E']
```

- **unified_data**: Your application state as a snapshot
- **snapshot**: Immutable data record with hash, timestamp, and metadata  
- **history**: Chronological sequence of snapshots
- **branches**: Parallel timelines created when inserting mid-history

### Philosophy: unified_data → snapshot → history → undo/redo

1. **unified_data**: Your app state (any serializable data)
2. **snapshot**: Immutable record with unique hash
3. **history**: Collection of snapshots in branches
4. **undo/redo**: Higher-level operations using time-travel

## API Reference 📚

### UniversalHistoryManager

#### Configuration

```typescript
const history = new UniversalHistoryManager({
  maxEntries: 1000,        // Maximum entries per branch
  debounceDelay: 300,      // Debounce delay in ms
  enableCompression: true, // Enable data compression
  autoCleanup: true        // Auto cleanup old entries
})
```

#### Core Methods

```typescript
// Record new state
record(data: T, options?: RecordOptions): string

// Navigate history
undo(): HistoryEntry<T> | null
redo(): HistoryEntry<T> | null
jumpTo(hash: string, options?: TimeravelOptions): HistoryEntry<T> | null
jumpToPosition(position: number, branchName?: string): HistoryEntry<T> | null

// Branch management
createBranch(name: string, fromHash?: string): boolean
switchBranch(name: string): boolean

// Query and state
query(predicate: (entry: HistoryEntry<T>) => boolean): readonly HistoryEntry<T>[]
getState(): HistoryState<T>
getCurrent(): HistoryEntry<T> | null
canUndo(): boolean
canRedo(): boolean

// Events
on(listener: HistoryListener<T>): () => void
```

### React Hooks

#### useHistory

Full-featured history management:

```typescript
const {
  current,        // Current data
  state,         // Full history state
  record,        // Record new state
  undo,          // Undo operation
  redo,          // Redo operation
  jumpTo,        // Time travel
  createBranch,  // Create branch
  switchBranch,  // Switch branch
  canUndo,       // Can undo?
  canRedo,       // Can redo?
  query,         // Query entries
  clear,         // Clear history
  manager        // Raw manager instance
} = useHistory<T>(options)
```

#### useUndo

Simplified undo/redo:

```typescript
const {
  data,     // Current data
  record,   // Record new state
  undo,     // Undo
  redo,     // Redo  
  canUndo,  // Can undo?
  canRedo,  // Can redo?
  clear     // Clear history
} = useUndo<T>(options)
```

#### useHistoryState

Read-only state observer:

```typescript
const {
  current,      // Current data
  state,        // Full state
  canUndo,      // Can undo?
  canRedo,      // Can redo?
  branches,     // Branch names
  activeBranch  // Active branch
} = useHistoryState(manager)
```

## Advanced Features 🔧

### Time Travel Modes

```typescript
// Readonly mode - just move cursor
history.jumpTo(hash, { mode: 'readonly' })

// Branch mode - create new branch from target
history.jumpTo(hash, { mode: 'branch', branchName: 'experiment' })
```

### Metadata Support

```typescript
history.record(data, {
  metadata: {
    user: 'alice',
    action: 'edit_text',
    timestamp: Date.now()
  }
})
```

### Debouncing

```typescript
// These rapid changes will be debounced
history.record('t')
history.record('te') 
history.record('tes')
history.record('test')  // Only this will be recorded
```

### Event System

```typescript
history.on(event => {
  console.log(event.type)  // 'record' | 'undo' | 'redo' | 'jump' | ...
  console.log(event.entry) // History entry
  console.log(event.metadata) // Event metadata
})
```

### Querying

```typescript
// Find all entries with specific data
const textEntries = history.query(entry => 
  entry.data.text?.includes('hello')
)

// Find entries by time range
const recentEntries = history.query(entry =>
  entry.timestamp > Date.now() - 3600000 // Last hour
)

// Find entries by metadata
const userEntries = history.query(entry =>
  entry.metadata?.user === 'alice'
)
```

## Examples 💡

See the `/examples` directory for complete examples:

- [`universal-usage.ts`](examples/universal-usage.ts) - Core API usage
- [`react-usage.tsx`](examples/react-usage.tsx) - React integration examples

### Text Editor

```tsx
function TextEditor() {
  const history = useHistory<string>({ 
    initialData: '',
    debounceDelay: 500 
  })

  return (
    <div>
      <textarea
        value={history.current || ''}
        onChange={(e) => history.record(e.target.value)}
      />
      <div>
        <button onClick={history.undo} disabled={!history.canUndo}>
          ⟲ Undo
        </button>
        <button onClick={history.redo} disabled={!history.canRedo}>
          ⟳ Redo
        </button>
      </div>
    </div>
  )
}
```

### Todo App with Branching

```tsx
function TodoApp() {
  const history = useHistory<TodoState>({
    initialData: { todos: [], filter: 'all' }
  })

  const addTodo = (text: string) => {
    const newState = {
      ...history.current,
      todos: [...history.current.todos, { id: Date.now(), text, done: false }]
    }
    history.record(newState, { 
      metadata: { action: 'add_todo' } 
    })
  }

  const createExperiment = () => {
    history.createBranch('experiment')
    history.switchBranch('experiment')
  }

  // ... rest of component
}
```

## Performance 🚀

- **Immutable snapshots**: No accidental mutations
- **Efficient cloning**: JSON-based deep cloning with optional compression
- **Memory management**: Auto-cleanup with configurable limits
- **Debounced recording**: Prevents excessive history entries
- **Hash-based navigation**: O(1) lookup for time travel
- **Event-driven updates**: Minimal re-renders in React

## Browser Support 🌐

- Modern browsers (ES2020+)
- Node.js 14+
- React 16.8+ (for hooks)

## Design Philosophy 🎨

Based on the principles of:

- **Immutability**: All snapshots are immutable
- **Predictability**: Deterministic behavior with pure functions
- **Flexibility**: Support for complex workflows and branching
- **Performance**: Optimized for real-world usage patterns
- **Developer Experience**: Intuitive APIs with TypeScript support
- **Modular Architecture**: High-cohesion, low-coupling design with specialized managers

The design follows the flow: `unified_data → snapshot → history → undo/redo`, where each step adds structure and capabilities while maintaining simplicity.

**v1.1.0+ Architecture**: The core system now uses a modular approach with `CursorManager` for intelligent cursor validation and `BranchManager` for branch operations, ensuring robust state management with automatic error correction.

## Contributing 🤝

We welcome feedback and contributions through GitHub issues and pull requests. A standalone contributing guide has not been split out yet.

## License 📄

MIT License - see [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for developers who care about user experience
</p>
