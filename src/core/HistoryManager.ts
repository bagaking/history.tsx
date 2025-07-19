import {
  HistoryManager,
  HistoryEntry,
  Branch,
  HistoryState,
  RecordOptions,
  TimeravelOptions,
  HistoryConfig,
  HistoryEvent,
  HistoryListener,
  Snapshot
} from '../types'
import { generateHash, deepClone, debounce, createEventEmitter } from './utils'

export class UniversalHistoryManager<T = any> implements HistoryManager<T> {
  private branches = new Map<string, Branch<T>>()
  private activeBranchName = 'main'
  private cursor = -1
  private config: Required<HistoryConfig>
  private eventEmitter = createEventEmitter<HistoryEvent<T>>()
  private debouncedRecord?: (data: T, options?: RecordOptions) => void

  constructor(config: HistoryConfig = {}) {
    this.config = {
      maxEntries: config.maxEntries ?? 1000,
      debounceDelay: config.debounceDelay ?? 300,
      enableCompression: config.enableCompression ?? true,
      autoCleanup: config.autoCleanup ?? true
    }

    // Initialize main branch
    this.branches.set('main', {
      name: 'main',
      entries: [],
      createdAt: new Date()
    })

    this.setupDebounce()
  }

  private setupDebounce(): void {
    this.debouncedRecord = debounce((data: T, options?: RecordOptions) => {
      this.recordImmediate(data, { ...options, debounce: false })
    }, this.config.debounceDelay)
  }

  private createEntry(data: T, branchName: string, position: number, parentHash?: string): HistoryEntry<T> {
    const timestamp = new Date()
    const hash = generateHash(data, timestamp, parentHash)
    
    return {
      hash,
      data: deepClone(data),
      timestamp,
      branchName,
      position,
      parentHash
    }
  }

  private emit(type: HistoryEvent<T>['type'], entry: HistoryEntry<T> | null, metadata?: Record<string, any>): void {
    this.eventEmitter.emit({
      type,
      entry,
      timestamp: new Date(),
      metadata
    })
  }

  private autoCreateBranch(fromHash: string): string {
    const timestamp = Date.now()
    const branchName = `branch-${timestamp}`
    this.createBranch(branchName, fromHash)
    return branchName
  }

  private recordImmediate(data: T, options: RecordOptions = {}): string {
    const branch = this.branches.get(this.activeBranchName)!
    const targetBranchName = options.branchName || this.activeBranchName
    
    // Check if we're inserting mid-history
    const isInsertingMidHistory = this.cursor < branch.entries.length - 1
    
    let actualBranchName = targetBranchName
    if (isInsertingMidHistory && targetBranchName === this.activeBranchName) {
      const currentEntry = branch.entries[this.cursor]
      actualBranchName = this.autoCreateBranch(currentEntry?.hash || '')
      this.switchBranch(actualBranchName)
    }

    const targetBranch = this.branches.get(actualBranchName)!
    const parentHash = targetBranch.entries[targetBranch.entries.length - 1]?.hash
    const position = targetBranch.entries.length
    
    const entry = this.createEntry(data, actualBranchName, position, parentHash)
    
    // Add metadata if provided
    if (options.metadata) {
      (entry as any).metadata = { ...options.metadata }
    }

    // Update branch
    const newEntries = [...targetBranch.entries, entry]
    this.branches.set(actualBranchName, {
      ...targetBranch,
      entries: newEntries
    })

    // Update cursor to point to the new entry
    this.cursor = newEntries.length - 1
    
    // Cleanup if needed
    if (this.config.autoCleanup && newEntries.length > this.config.maxEntries) {
      this.cleanup(actualBranchName)
    }

    this.emit('record', entry, options.metadata)
    return entry.hash
  }

  private cleanup(branchName: string): void {
    const branch = this.branches.get(branchName)!
    const excess = branch.entries.length - this.config.maxEntries
    
    if (excess > 0) {
      const newEntries = branch.entries.slice(excess)
      this.branches.set(branchName, {
        ...branch,
        entries: newEntries
      })
      
      // Adjust cursor
      this.cursor = Math.max(0, this.cursor - excess)
    }
  }

  record(data: T, options: RecordOptions = {}): string {
    if (options.debounce !== false && this.debouncedRecord) {
      this.debouncedRecord(data, options)
      return `debounced-${Date.now()}` // Return placeholder for debounced operations
    }
    
    return this.recordImmediate(data, options)
  }

  undo(): HistoryEntry<T> | null {
    if (!this.canUndo()) return null
    
    this.cursor--
    const branch = this.branches.get(this.activeBranchName)!
    const entry = branch.entries[this.cursor] || null
    
    this.emit('undo', entry)
    return entry
  }

  redo(): HistoryEntry<T> | null {
    if (!this.canRedo()) return null
    
    this.cursor++
    const branch = this.branches.get(this.activeBranchName)!
    const entry = branch.entries[this.cursor]
    
    this.emit('redo', entry)
    return entry
  }

  jumpTo(hash: string, options: TimeravelOptions = {}): HistoryEntry<T> | null {
    for (const [branchName, branch] of this.branches) {
      const entryIndex = branch.entries.findIndex(e => e.hash === hash)
      if (entryIndex !== -1) {
        const entry = branch.entries[entryIndex]
        
        if (options.mode === 'branch' && branchName !== this.activeBranchName) {
          const newBranchName = options.branchName || this.autoCreateBranch(hash)
          this.switchBranch(newBranchName)
        } else if (options.mode !== 'readonly') {
          this.switchBranch(branchName)
        }
        
        this.cursor = entryIndex
        this.emit('jump', entry, { fromBranch: branchName, mode: options.mode })
        return entry
      }
    }
    
    return null
  }

  jumpToPosition(position: number, branchName?: string): HistoryEntry<T> | null {
    const targetBranch = branchName || this.activeBranchName
    const branch = this.branches.get(targetBranch)
    
    if (!branch || position < 0 || position >= branch.entries.length) {
      return null
    }
    
    if (branchName && branchName !== this.activeBranchName) {
      this.switchBranch(branchName)
    }
    
    this.cursor = position
    const entry = branch.entries[position]
    this.emit('jump', entry, { position, branch: targetBranch })
    return entry
  }

  createBranch(name: string, fromHash?: string): boolean {
    if (this.branches.has(name)) return false
    
    let parentHash: string | undefined
    if (fromHash) {
      const exists = Array.from(this.branches.values())
        .some(branch => branch.entries.some(entry => entry.hash === fromHash))
      if (!exists) return false
      parentHash = fromHash
    }

    this.branches.set(name, {
      name,
      entries: [],
      createdAt: new Date(),
      parentHash
    })

    this.emit('branch-created', null, { branchName: name, parentHash })
    return true
  }

  switchBranch(name: string): boolean {
    const branch = this.branches.get(name)
    if (!branch) return false
    
    this.activeBranchName = name
    this.cursor = Math.min(this.cursor, branch.entries.length - 1)
    
    this.emit('branch-switched', this.getCurrent(), { branchName: name })
    return true
  }

  query(predicate: (entry: HistoryEntry<T>) => boolean): readonly HistoryEntry<T>[] {
    const results: HistoryEntry<T>[] = []
    
    for (const branch of this.branches.values()) {
      results.push(...branch.entries.filter(predicate))
    }
    
    return results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  getSnapshot(hash: string): Snapshot<T> | null {
    for (const branch of this.branches.values()) {
      const entry = branch.entries.find(e => e.hash === hash)
      if (entry) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { branchName, position, ...snapshot } = entry
        return snapshot
      }
    }
    return null
  }

  getCurrent(): HistoryEntry<T> | null {
    const branch = this.branches.get(this.activeBranchName)
    return branch?.entries[this.cursor] || null
  }

  getState(): HistoryState<T> {
    return {
      current: this.getCurrent(),
      branches: new Map(this.branches),
      mainBranch: this.branches.get('main')!,
      activeBranch: this.activeBranchName,
      cursor: this.cursor
    }
  }

  canUndo(): boolean {
    return this.cursor > 0
  }

  canRedo(): boolean {
    const branch = this.branches.get(this.activeBranchName)
    return branch ? this.cursor < branch.entries.length - 1 : false
  }

  clear(): void {
    this.branches.clear()
    this.branches.set('main', {
      name: 'main',
      entries: [],
      createdAt: new Date()
    })
    this.activeBranchName = 'main'
    this.cursor = -1
    this.eventEmitter.clear()
  }

  on(listener: HistoryListener<T>): () => void {
    return this.eventEmitter.on(listener)
  }
}