import {
  HistoryManager,
  HistoryEntry,
  HistoryState,
  RecordOptions,
  TimeravelOptions,
  HistoryConfig,
  HistoryEvent,
  HistoryListener,
  Snapshot
} from '../types'
import { generateHash, deepClone, debounce, createEventEmitter } from './utils'
import { CursorManager } from './CursorManager'
import { BranchManager } from './BranchManager'

export class UniversalHistoryManager<T = any> implements HistoryManager<T> {
  private branchManager = new BranchManager<T>()
  private cursorManager = new CursorManager<T>()
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

    this.setupDebounce()
  }

  private getCurrentBranch = () => this.branchManager.getCurrentBranch()

  get cursor(): number {
    return this.cursorManager.getValidatedCursor(this.getCurrentBranch)
  }

  set cursor(value: number) {
    this.cursorManager.cursor = value
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

  private recordImmediate(data: T, options: RecordOptions = {}): string {
    const branch = this.branchManager.getCurrentBranch()!
    const targetBranchName = options.branchName || this.branchManager.getActiveBranchName()
    
    // Check if we're inserting mid-history
    const isInsertingMidHistory = this.cursor < branch.entries.length - 1
    
    if (isInsertingMidHistory && targetBranchName === this.branchManager.getActiveBranchName()) {
      const currentEntry = branch.entries[this.cursor]
      
      // Extract entries that should be moved to the new branch (from cursor+1 onwards)
      const branchEntries = branch.entries.slice(this.cursor + 1)
      
      // Create new branch with the extracted entries (but stay on main branch)
      this.branchManager.autoCreateBranch(currentEntry?.hash || '', branchEntries)
      
      // Truncate current branch to keep only entries up to cursor
      this.branchManager.truncateBranch(this.branchManager.getActiveBranchName(), this.cursor + 1)
      
      // Invalidate cursor as entries structure has changed
      this.cursorManager.invalidate()
    }

    const targetBranch = this.branchManager.getBranch(targetBranchName)!
    const parentHash = targetBranch.entries[targetBranch.entries.length - 1]?.hash
    const position = targetBranch.entries.length
    
    const entry = this.createEntry(data, targetBranchName, position, parentHash)
    
    // Add metadata if provided
    if (options.metadata) {
      (entry as any).metadata = { ...options.metadata }
    }

    // Add entry to branch
    this.branchManager.addEntryToBranch(targetBranchName, entry)

    // Update cursor to point to the new entry (now at the end)
    const updatedBranch = this.branchManager.getBranch(targetBranchName)!
    this.cursor = updatedBranch.entries.length - 1
    
    // Cleanup if needed
    if (this.config.autoCleanup) {
      const cleanedCount = this.branchManager.cleanupBranch(targetBranchName, this.config.maxEntries)
      if (cleanedCount > 0) {
        this.cursorManager.invalidate()
      }
    }

    this.emit('record', entry, options.metadata)
    return entry.hash
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
    const branch = this.branchManager.getCurrentBranch()!
    const entry = branch.entries[this.cursor] || null
    
    this.emit('undo', entry)
    return entry
  }

  redo(): HistoryEntry<T> | null {
    if (!this.canRedo()) return null
    
    this.cursor++
    const branch = this.branchManager.getCurrentBranch()!
    const entry = branch.entries[this.cursor]
    
    this.emit('redo', entry)
    return entry
  }

  jumpTo(hash: string, options: TimeravelOptions = {}): HistoryEntry<T> | null {
    const result = this.branchManager.findEntryInAllBranches(hash)
    if (!result) return null
    
    const { entry, branchName, index } = result
    
    if (options.mode === 'branch' && branchName !== this.branchManager.getActiveBranchName()) {
      const newBranchName = options.branchName || this.branchManager.autoCreateBranch(hash)
      this.switchBranch(newBranchName)
    } else if (options.mode !== 'readonly') {
      this.switchBranch(branchName)
    }
    
    this.cursor = index
    this.emit('jump', entry, { fromBranch: branchName, mode: options.mode })
    return entry
  }

  jumpToPosition(position: number, branchName?: string): HistoryEntry<T> | null {
    const targetBranch = branchName || this.branchManager.getActiveBranchName()
    const branch = this.branchManager.getBranch(targetBranch)
    
    if (!branch || position < 0 || position >= branch.entries.length) {
      return null
    }
    
    if (branchName && branchName !== this.branchManager.getActiveBranchName()) {
      this.switchBranch(branchName)
    }
    
    this.cursor = position
    const entry = branch.entries[position]
    this.emit('jump', entry, { position, branch: targetBranch })
    return entry
  }

  createBranch(name: string, fromHash?: string): boolean {
    const success = this.branchManager.createBranch(name, fromHash)
    if (success) {
      this.emit('branch-created', null, { branchName: name, parentHash: fromHash })
    }
    return success
  }

  switchBranch(name: string): boolean {
    const success = this.branchManager.switchBranch(name)
    if (success) {
      // Cursor may be invalid for the new branch, invalidate to trigger validation
      this.cursorManager.invalidate()
      this.emit('branch-switched', this.getCurrent(), { branchName: name })
    }
    return success
  }

  query(predicate: (entry: HistoryEntry<T>) => boolean): readonly HistoryEntry<T>[] {
    const results: HistoryEntry<T>[] = []
    
    for (const branch of this.branchManager.getAllBranches().values()) {
      results.push(...branch.entries.filter(predicate))
    }
    
    return results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  getSnapshot(hash: string): Snapshot<T> | null {
    const result = this.branchManager.findEntryInAllBranches(hash)
    if (result) {
      const { entry } = result
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { branchName, position, ...snapshot } = entry
      return snapshot
    }
    return null
  }

  getCurrent(): HistoryEntry<T> | null {
    const branch = this.branchManager.getCurrentBranch()
    return branch?.entries[this.cursor] || null
  }

  getState(): HistoryState<T> {
    return {
      current: this.getCurrent(),
      branches: this.branchManager.getAllBranches(),
      mainBranch: this.branchManager.getBranch('main')!,
      activeBranch: this.branchManager.getActiveBranchName(),
      cursor: this.cursor
    }
  }

  canUndo(): boolean {
    return this.cursorManager.canUndo(this.getCurrentBranch)
  }

  canRedo(): boolean {
    return this.cursorManager.canRedo(this.getCurrentBranch)
  }

  clear(): void {
    this.branchManager.clear()
    this.cursorManager.reset()
    this.eventEmitter.clear()
  }

  on(listener: HistoryListener<T>): () => void {
    return this.eventEmitter.on(listener)
  }
}