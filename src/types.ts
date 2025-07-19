export interface Snapshot<T = any> {
  readonly hash: string
  readonly data: T
  readonly timestamp: Date
  readonly metadata?: Record<string, any>
  readonly parentHash?: string
}

export interface HistoryEntry<T = any> extends Snapshot<T> {
  readonly branchName: string
  readonly position: number
}

export interface Branch<T = any> {
  readonly name: string
  readonly entries: readonly HistoryEntry<T>[]
  readonly createdAt: Date
  readonly parentHash?: string
}

export interface HistoryState<T = any> {
  readonly current: HistoryEntry<T> | null
  readonly branches: ReadonlyMap<string, Branch<T>>
  readonly mainBranch: Branch<T>
  readonly activeBranch: string
  readonly cursor: number
}

export interface RecordOptions {
  readonly metadata?: Record<string, any>
  readonly debounce?: boolean
  readonly branchName?: string
}

export interface TimeravelOptions {
  readonly mode?: 'readonly' | 'branch'
  readonly branchName?: string
}

export interface HistoryConfig {
  readonly maxEntries?: number
  readonly debounceDelay?: number
  readonly enableCompression?: boolean
  readonly autoCleanup?: boolean
}

export interface HistoryManager<T = any> {
  record(data: T, options?: RecordOptions): string
  undo(): HistoryEntry<T> | null
  redo(): HistoryEntry<T> | null
  jumpTo(hash: string, options?: TimeravelOptions): HistoryEntry<T> | null
  jumpToPosition(position: number, branchName?: string): HistoryEntry<T> | null
  createBranch(name: string, fromHash?: string): boolean
  switchBranch(name: string): boolean
  query(predicate: (entry: HistoryEntry<T>) => boolean): readonly HistoryEntry<T>[]
  getSnapshot(hash: string): Snapshot<T> | null
  getState(): HistoryState<T>
  clear(): void
  canUndo(): boolean
  canRedo(): boolean
  on(listener: HistoryListener<T>): () => void
}

export type HistoryEventType = 
  | 'record' 
  | 'undo' 
  | 'redo' 
  | 'jump' 
  | 'branch-created' 
  | 'branch-switched'

export interface HistoryEvent<T = any> {
  readonly type: HistoryEventType
  readonly entry: HistoryEntry<T> | null
  readonly timestamp: Date
  readonly metadata?: Record<string, any>
}

export type HistoryListener<T = any> = (event: HistoryEvent<T>) => void