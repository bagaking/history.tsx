import { useCallback, useEffect, useRef, useState } from 'react'
import { 
  HistoryManager, 
  HistoryEntry, 
  HistoryState, 
  RecordOptions, 
  TimeravelOptions,
  HistoryConfig,
  HistoryEvent
} from '../types'
import { UniversalHistoryManager } from '../core/HistoryManager'

export interface UseHistoryOptions<T> extends HistoryConfig {
  initialData?: T
  autoRecord?: boolean
}

export interface UseHistoryReturn<T> {
  // Current state
  current: T | null
  state: HistoryState<T>
  
  // Operations
  record: (data: T, options?: RecordOptions) => string
  undo: () => void
  redo: () => void
  jumpTo: (hash: string, options?: TimeravelOptions) => void
  jumpToPosition: (position: number, branchName?: string) => void
  
  // Branch operations
  createBranch: (name: string, fromHash?: string) => boolean
  switchBranch: (name: string) => boolean
  
  // State queries
  canUndo: boolean
  canRedo: boolean
  
  // Advanced
  query: (predicate: (entry: HistoryEntry<T>) => boolean) => readonly HistoryEntry<T>[]
  clear: () => void
  manager: HistoryManager<T>
}

export const useHistory = <T = any>(options: UseHistoryOptions<T> = {}): UseHistoryReturn<T> => {
  const managerRef = useRef<HistoryManager<T>>()
  const [, forceUpdate] = useState({})
  
  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new UniversalHistoryManager<T>(options)
    
    // Record initial data if provided
    if (options.initialData !== undefined) {
      managerRef.current.record(options.initialData)
    }
  }
  
  const manager = managerRef.current
  
  // Force re-render when history changes
  const triggerUpdate = useCallback(() => {
    forceUpdate({})
  }, [])
  
  // Subscribe to history events
  useEffect(() => {
    const unsubscribe = manager.on(triggerUpdate)
    return unsubscribe
  }, [manager, triggerUpdate])
  
  // Get current state
  const state = manager.getState()
  const current = state.current?.data || null
  
  // Memoized operations
  const record = useCallback((data: T, recordOptions?: RecordOptions) => {
    return manager.record(data, recordOptions)
  }, [manager])
  
  const undo = useCallback(() => {
    manager.undo()
  }, [manager])
  
  const redo = useCallback(() => {
    manager.redo()
  }, [manager])
  
  const jumpTo = useCallback((hash: string, jumpOptions?: TimeravelOptions) => {
    manager.jumpTo(hash, jumpOptions)
  }, [manager])
  
  const jumpToPosition = useCallback((position: number, branchName?: string) => {
    manager.jumpToPosition(position, branchName)
  }, [manager])
  
  const createBranch = useCallback((name: string, fromHash?: string) => {
    return manager.createBranch(name, fromHash)
  }, [manager])
  
  const switchBranch = useCallback((name: string) => {
    return manager.switchBranch(name)
  }, [manager])
  
  const query = useCallback((predicate: (entry: HistoryEntry<T>) => boolean) => {
    return manager.query(predicate)
  }, [manager])
  
  const clear = useCallback(() => {
    manager.clear()
  }, [manager])
  
  return {
    current,
    state,
    record,
    undo,
    redo,
    jumpTo,
    jumpToPosition,
    createBranch,
    switchBranch,
    canUndo: manager.canUndo(),
    canRedo: manager.canRedo(),
    query,
    clear,
    manager
  }
}

export interface UseUndoOptions<T> extends UseHistoryOptions<T> {
  onUndo?: (data: T) => void
  onRedo?: (data: T) => void
}

export interface UseUndoReturn<T> {
  data: T | null
  record: (data: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clear: () => void
}

export const useUndo = <T = any>(options: UseUndoOptions<T> = {}): UseUndoReturn<T> => {
  const history = useHistory<T>(options)
  
  const record = useCallback((data: T) => {
    history.record(data)
  }, [history])
  
  const undo = useCallback(() => {
    const prevEntry = history.state.current
    history.undo()
    if (options.onUndo && prevEntry) {
      options.onUndo(prevEntry.data)
    }
  }, [history, options])
  
  const redo = useCallback(() => {
    history.redo()
    if (options.onRedo && history.current) {
      options.onRedo(history.current)
    }
  }, [history, options])
  
  return {
    data: history.current,
    record,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    clear: history.clear
  }
}

export interface UseHistoryStateReturn<T> {
  current: T | null
  state: HistoryState<T>
  canUndo: boolean
  canRedo: boolean
  branches: readonly string[]
  activeBranch: string
}

export const useHistoryState = <T = any>(manager: HistoryManager<T>): UseHistoryStateReturn<T> => {
  const [, forceUpdate] = useState({})
  
  const triggerUpdate = useCallback(() => {
    forceUpdate({})
  }, [])
  
  useEffect(() => {
    const unsubscribe = manager.on(triggerUpdate)
    return unsubscribe
  }, [manager, triggerUpdate])
  
  const state = manager.getState()
  
  return {
    current: state.current?.data || null,
    state,
    canUndo: manager.canUndo(),
    canRedo: manager.canRedo(),
    branches: Array.from(state.branches.keys()),
    activeBranch: state.activeBranch
  }
}

export interface UseHistoryEventOptions<T> {
  onRecord?: (entry: HistoryEntry<T>) => void
  onUndo?: (entry: HistoryEntry<T> | null) => void
  onRedo?: (entry: HistoryEntry<T> | null) => void
  onJump?: (entry: HistoryEntry<T> | null) => void
  onBranchCreated?: (branchName: string) => void
  onBranchSwitched?: (branchName: string) => void
}

export const useHistoryEvents = <T = any>(
  manager: HistoryManager<T>, 
  options: UseHistoryEventOptions<T>
): void => {
  useEffect(() => {
    const unsubscribe = manager.on((event: HistoryEvent<T>) => {
      switch (event.type) {
        case 'record':
          options.onRecord?.(event.entry!)
          break
        case 'undo':
          options.onUndo?.(event.entry)
          break
        case 'redo':
          options.onRedo?.(event.entry)
          break
        case 'jump':
          options.onJump?.(event.entry)
          break
        case 'branch-created':
          options.onBranchCreated?.(event.metadata?.branchName)
          break
        case 'branch-switched':
          options.onBranchSwitched?.(event.metadata?.branchName)
          break
      }
    })
    
    return unsubscribe
  }, [manager, options])
}