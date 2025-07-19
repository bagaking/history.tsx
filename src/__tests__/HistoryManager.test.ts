import { UniversalHistoryManager } from '../core/HistoryManager'
import { HistoryEntry, HistoryEvent } from '../types'

describe('UniversalHistoryManager', () => {
  let history: UniversalHistoryManager<any>

  beforeEach(() => {
    history = new UniversalHistoryManager()
  })

  describe('Basic Operations', () => {
    test('should record data and create history entry', () => {
      const data = { value: 'test' }
      const hash = history.record(data, { debounce: false })
      
      expect(hash).toBeDefined()
      expect(history.getCurrent()?.data).toEqual(data)
      expect(history.canUndo()).toBe(false) // No previous entry
      expect(history.canRedo()).toBe(false)
    })

    test('should handle undo/redo operations', () => {
      const data1 = { value: 'first' }
      const data2 = { value: 'second' }
      
      history.record(data1, { debounce: false })
      history.record(data2, { debounce: false })
      
      expect(history.getCurrent()?.data).toEqual(data2)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
      
      // Undo
      const undoResult = history.undo()
      expect(undoResult?.data).toEqual(data1)
      expect(history.getCurrent()?.data).toEqual(data1)
      expect(history.canRedo()).toBe(true)
      
      // Redo
      const redoResult = history.redo()
      expect(redoResult?.data).toEqual(data2)
      expect(history.getCurrent()?.data).toEqual(data2)
    })

    test('should handle multiple entries and navigation', () => {
      const entries = [
        { value: 'entry1' },
        { value: 'entry2' },
        { value: 'entry3' }
      ]
      
      const hashes = entries.map(entry => history.record(entry, { debounce: false }))
      
      // Test jumping to specific hash
      const jumpResult = history.jumpTo(hashes[0])
      expect(jumpResult?.data).toEqual(entries[0])
      expect(history.getCurrent()?.data).toEqual(entries[0])
      
      // Test jumping to position
      history.jumpToPosition(2)
      expect(history.getCurrent()?.data).toEqual(entries[2])
    })
  })

  describe('Branch Operations', () => {
    test('should create and switch branches', () => {
      const mainData = { value: 'main' }
      history.record(mainData, { debounce: false })
      
      // Create new branch
      const created = history.createBranch('feature')
      expect(created).toBe(true)
      
      // Switch to new branch
      const switched = history.switchBranch('feature')
      expect(switched).toBe(true)
      
      const state = history.getState()
      expect(state.activeBranch).toBe('feature')
    })

    test('should auto-create branch when inserting mid-history', () => {
      const data1 = { value: 'first' }
      const data2 = { value: 'second' }
      const data3 = { value: 'third' }
      
      history.record(data1, { debounce: false })
      history.record(data2, { debounce: false })
      
      // Go back to first entry
      history.undo()
      expect(history.getCurrent()?.data).toEqual(data1)
      
      // Record new data - should create new branch
      history.record(data3, { debounce: false })
      
      const state = history.getState()
      expect(state.activeBranch).not.toBe('main')
      expect(history.getCurrent()?.data).toEqual(data3)
    })
  })

  describe('State Management', () => {
    test('should provide accurate state information', () => {
      const data1 = { value: 'test1' }
      const data2 = { value: 'test2' }
      
      history.record(data1, { debounce: false })
      history.record(data2, { debounce: false })
      
      const state = history.getState()
      
      expect(state.current?.data).toEqual(data2)
      expect(state.activeBranch).toBe('main')
      expect(state.branches.has('main')).toBe(true)
      expect(state.cursor).toBe(1)
    })

    test('should handle clear operation', () => {
      history.record({ value: 'test' }, { debounce: false })
      expect(history.getCurrent()).toBeTruthy()
      
      history.clear()
      expect(history.getCurrent()).toBeNull()
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('Query Operations', () => {
    test('should query entries by predicate', () => {
      const entries = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 }
      ]
      
      entries.forEach(entry => history.record(entry, { debounce: false }))
      
      const typeAEntries = history.query((entry: HistoryEntry<any>) => entry.data.type === 'A')
      expect(typeAEntries).toHaveLength(2)
      expect(typeAEntries.every((entry: HistoryEntry<any>) => entry.data.type === 'A')).toBe(true)
    })
  })

  describe('Event System', () => {
    test('should emit events for operations', () => {
      const events: Array<{ type: string; entry: any }> = []
      
      history.on((event: HistoryEvent<any>) => {
        events.push({ type: event.type, entry: event.entry })
      })
      
      const data1 = { value: 'test1' }
      const data2 = { value: 'test2' }
      history.record(data1, { debounce: false })
      history.record(data2, { debounce: false })
      history.undo()
      history.redo()
      
      expect(events).toHaveLength(4)
      expect(events[0].type).toBe('record')
      expect(events[1].type).toBe('record')
      expect(events[2].type).toBe('undo')
      expect(events[3].type).toBe('redo')
    })
  })
})