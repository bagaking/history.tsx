# Design: Universal Undo/Redo Management System

## Designer's idea

对于一个 react 组件或者复杂界面来说，我们的每次变更都会对应到一个数据 (unified_data) 的更新上
unified_data 会在本地被更新，也可能会同步到远端和从远端同步，但无论如何，会有一个时刻，对应到一个 snapshot 版本
因此，我们可以提供通用的 history 管理机制，对 snapshot 的 history 进行管理。基于这套 history 系统，我们可以形成 undo 和 redo 机制, 或是版本分支管理机制。

初步想下来, 我们需要 history 功能包括了:
- 记录的组织方式：unified_data 过程数据应该形成数据的 history 记录。history 是主(main)列表 + 分支(branch)列表的结构。每个项都有自己的唯一哈希和 immutable 的生成时间等元信息.
  - 并可以提供查询，并为其他功能 (如本地记录, 提供数据和恢复能力) 提供基础
- 数据的范围：unified_data 任何变化都会形成版本
- 回溯的支持：
  - 要求使用方传入变更数据的方法后，支持跳转到任何一个版本。而提供的接口调用, 也支持回溯并不写历史记录 和 通过新建历史的方式回溯 两种接口.
  - 回溯并不写历史记录接口，调用变更数据方法，并记录游标位置
  - 新建历史的方式回溯接口，调用变更数据方法，并在当前游标后插入一个版本
  - history 支持分支，如果当前游标后本来就有记录，同时又需要再当前游标插入内容的话，会形成 branch。
  - 形成 branch 时，将当前游标以后的所有历史, 转移到一个以时间命名的 branch, 然后再插入新的记录。branch 除了记录被移入的列表，也记录其分叉的 hash。
- undo 和 redo 是基于回溯机制的上层实现
  - 使用回溯并不写历史记录接口, 游标向前移动一个版本，也就支持了 undo. 
  - 只有在游标不在队列尾部的时候可以进行 redo, redo 使用回溯并不写历史记录接口, 向后移动一个版本. 此时由于会新产生 history, 会形成 branch.
- 优化
  - Debounce, 未变化的内容不会形成版本、用户的连续操作, 应该 debounce 后合并成一条历史记录

关于 branch 逻辑，举个例子
- 对于 1 2 3 4 5, 假设游标在 3, 没有 branch，假设现在要插入一项 6
- main 会变成 1 2 3 6, 而 branch 里头会有 4 5, 这个 branch 里头会记录它的 fork 位置为 3 对应的节点

## Core Philosophy
unified_data → snapshot → history → undo/redo

## Architecture

### 1. History Structure
- **main**: Primary timeline of snapshots
- **branches**: Forked timelines when new changes occur mid-history
- Each entry: `{hash, data, timestamp, metadata, parentHash}`

### 2. Operations

#### Basic
- `record(data)`: Add new snapshot
- `undo()`: Move cursor back (no branch)
- `redo()`: Move cursor forward (creates branch if not at tip)

#### Advanced
- `jumpTo(hash, mode)`: 
  - `mode: 'readonly'` - just move cursor
  - `mode: 'branch'` - create new branch from here
- `query(filter)`: Search history by time/data/metadata

### 3. Branching Logic
When inserting at non-tip:
1. Current position → new branch
2. Future history → moves to branch
3. New change → becomes new tip
4. Branch metadata: `{name, forkPoint, snapshots}`

### 4. Optimization Layer
- **Debounce**: Merge rapid changes within threshold
- **Diff compression**: Store diffs instead of full snapshots
- **Memory limits**: Automatic pruning of old branches

### 5. Integration Patterns
```typescript
// React hook usage
const [data, setData] = useState(initial)
const {undo, redo, canUndo, canRedo} = useHistory(data, setData)

// Manual integration
const history = new HistoryManager<T>()
history.onChange = (newData) => updateUI(newData)
```

### 6. Remote Sync Considerations
- **Conflict resolution**: Last-write-wins with client timestamps
- **Partial sync**: Only sync main branch by default
- **Offline support**: Queue changes, sync on reconnect

### 7. Performance
- **Lazy loading**: Load branch snapshots on-demand
- **Serialization**: Efficient binary format for storage
- **Memory**: WeakMap for snapshot deduplication

## API Surface
```typescript
interface History<T> {
  record(data: T, metadata?: any): string // returns hash
  undo(): boolean
  redo(): boolean
  jumpTo(hash: string, options?: JumpOptions): boolean
  getCurrent(): T
  getHistory(): Snapshot<T>[]
  getBranches(): Branch[]
  clear(): void
}
```