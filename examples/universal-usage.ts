import { UniversalHistoryManager } from '@bagaking/history.tsx'

// === Basic Usage ===
console.log('=== Basic Usage ===')

const history = new UniversalHistoryManager<{ text: string }>()

// Record some states
const hash1 = history.record({ text: 'Hello' })
const hash2 = history.record({ text: 'Hello World' })
const hash3 = history.record({ text: 'Hello World!' })

console.log('Current:', history.getCurrent()?.data) // { text: 'Hello World!' }
console.log('Can undo:', history.canUndo()) // true
console.log('Can redo:', history.canRedo()) // false

// Undo/Redo
history.undo()
console.log('After undo:', history.getCurrent()?.data) // { text: 'Hello World' }

history.redo()
console.log('After redo:', history.getCurrent()?.data) // { text: 'Hello World!' }

// === Time Travel ===
console.log('\n=== Time Travel ===')

// Jump to specific hash
history.jumpTo(hash1)
console.log('Jumped to first:', history.getCurrent()?.data) // { text: 'Hello' }

// Jump by position
history.jumpToPosition(2) // Last entry
console.log('Jumped to position 2:', history.getCurrent()?.data) // { text: 'Hello World!' }

// === Branching ===
console.log('\n=== Branching ===')

// Go back to middle and create branch by recording
history.jumpToPosition(1) // 'Hello World'
history.record({ text: 'Hello Universe' }) // This creates a new branch

const state = history.getState()
console.log('Active branch:', state.activeBranch) // 'branch-[timestamp]'
console.log('Current:', history.getCurrent()?.data) // { text: 'Hello Universe' }

// Switch back to main branch
history.switchBranch('main')
console.log('Back to main:', history.getCurrent()?.data) // { text: 'Hello World' }

// === Manual Branch Creation ===
console.log('\n=== Manual Branch Creation ===')

history.createBranch('feature', hash2)
history.switchBranch('feature')
history.record({ text: 'Feature: Hello World with feature' })

console.log('Feature branch:', history.getCurrent()?.data)

// === Query History ===
console.log('\n=== Query History ===')

const worldEntries = history.query(entry => 
  entry.data.text.includes('World')
)
console.log('Entries with "World":', worldEntries.length)

// === Event Listening ===
console.log('\n=== Event Listening ===')

const history2 = new UniversalHistoryManager<number>()

history2.on(event => {
  console.log(`Event: ${event.type}, Data: ${event.entry?.data}`)
})

history2.record(1) // Event: record, Data: 1
history2.record(2) // Event: record, Data: 2
history2.undo()    // Event: undo, Data: 1

// === Debounce ===
console.log('\n=== Debounce ===')

const history3 = new UniversalHistoryManager<string>({
  debounceDelay: 100
})

// These will be debounced
history3.record('t')
history3.record('te')
history3.record('tes')
history3.record('test')

// Only the last one will be recorded after delay
setTimeout(() => {
  console.log('After debounce:', history3.getCurrent()?.data) // 'test'
}, 200)

// === Configuration ===
console.log('\n=== Configuration ===')

const history4 = new UniversalHistoryManager({
  maxEntries: 100,
  debounceDelay: 300,
  enableCompression: true,
  autoCleanup: true
})

console.log('Configured history created')

// === Metadata ===
console.log('\n=== Metadata ===')

const history5 = new UniversalHistoryManager<{ value: number }>()

history5.record({ value: 42 }, {
  metadata: {
    user: 'alice',
    action: 'initial_value',
    timestamp: Date.now()
  }
})

const entry = history5.getCurrent()
console.log('Entry with metadata:', entry?.metadata)