// Core universal layer example
import HistoryManager, { UniversalHistoryManager } from '../dist/core/HistoryManager.js'

// Example 1: Document editing with auto-branching
interface Document {
  title: string
  content: string
  lastModified: Date
}

class DocumentEditor {
  private history = new UniversalHistoryManager<Document>({
    debounceDelay: 1000,
    maxEntries: 500
  })

  constructor(initialDoc: Document) {
    this.history.record(initialDoc, { 
      metadata: { action: 'initial_load' } 
    })
  }

  updateTitle(title: string) {
    const current = this.history.getCurrent()?.data
    if (!current) return

    this.history.record({
      ...current,
      title,
      lastModified: new Date()
    }, {
      metadata: { action: 'title_change', field: 'title' }
    })
  }

  updateContent(content: string) {
    const current = this.history.getCurrent()?.data
    if (!current) return

    this.history.record({
      ...current,
      content,
      lastModified: new Date()
    }, {
      metadata: { action: 'content_change', field: 'content' }
    })
  }

  createDraft() {
    const current = this.history.getCurrent()
    if (!current) return null

    const draftName = `draft-${Date.now()}`
    this.history.createBranch(draftName, current.hash)
    this.history.switchBranch(draftName)
    return draftName
  }

  getCurrent() {
    return this.history.getCurrent()?.data
  }

  undo() { return this.history.undo() }
  redo() { return this.history.redo() }
  
  getRevisionHistory() {
    return this.history.query(() => true)
      .map(entry => ({
        hash: entry.hash,
        timestamp: entry.timestamp,
        action: entry.metadata?.action,
        title: entry.data.title
      }))
  }
}

// Example 2: State machine with history
enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

interface GameSnapshot {
  state: GameState
  score: number
  level: number
  playerPosition: { x: number; y: number }
  enemies: Array<{ id: string; x: number; y: number; health: number }>
}

class GameHistoryManager {
  private history = new UniversalHistoryManager<GameSnapshot>({
    maxEntries: 1000,
    debounceDelay: 100,
    autoCleanup: true
  })

  private saveStates = new Set<string>()

  record(snapshot: GameSnapshot, isSavePoint = false) {
    const hash = this.history.record(snapshot, {
      metadata: {
        savePoint: isSavePoint,
        timestamp: Date.now()
      }
    })

    if (isSavePoint) {
      this.saveStates.add(hash)
    }

    return hash
  }

  loadSavePoint(hash: string) {
    if (!this.saveStates.has(hash)) {
      throw new Error('Invalid save point')
    }

    return this.history.jumpTo(hash, { mode: 'readonly' })
  }

  rewind(seconds: number) {
    const targetTime = Date.now() - (seconds * 1000)
    const entries = this.history.query(entry =>
      entry.timestamp.getTime() >= targetTime
    )

    if (entries.length > 0) {
      return this.history.jumpTo(entries[0].hash)
    }

    return null
  }

  createTimelineCheckpoint() {
    const current = this.history.getCurrent()
    if (!current) return null

    const checkpointName = `checkpoint-${current.data.level}-${Date.now()}`
    this.history.createBranch(checkpointName)
    this.history.switchBranch(checkpointName)

    return checkpointName
  }

  getSavePoints() {
    return this.history.query(entry => 
      entry.metadata?.savePoint === true
    ).map(entry => ({
      hash: entry.hash,
      timestamp: entry.timestamp,
      level: entry.data.level,
      score: entry.data.score
    }))
  }
}

// Example 3: Collaborative editing with conflict resolution
interface CollaborativeDoc {
  id: string
  content: string
  version: number
  authors: string[]
}

class CollaborativeEditor {
  private localHistory = new UniversalHistoryManager<CollaborativeDoc>()
  private remoteHistory = new UniversalHistoryManager<CollaborativeDoc>()

  constructor(initialDoc: CollaborativeDoc) {
    this.localHistory.record(initialDoc)
    this.remoteHistory.record(initialDoc)
  }

  // Local edit
  edit(content: string, author: string) {
    const current = this.localHistory.getCurrent()?.data
    if (!current) return

    const newDoc: CollaborativeDoc = {
      ...current,
      content,
      version: current.version + 1,
      authors: [...new Set([...current.authors, author])]
    }

    return this.localHistory.record(newDoc, {
      metadata: { author, type: 'local_edit' }
    })
  }

  // Receive remote changes
  applyRemoteChange(doc: CollaborativeDoc, author: string) {
    const localCurrent = this.localHistory.getCurrent()?.data
    const remoteCurrent = this.remoteHistory.getCurrent()?.data

    // Record remote change
    this.remoteHistory.record(doc, {
      metadata: { author, type: 'remote_edit' }
    })

    // Check for conflicts
    if (localCurrent && localCurrent.version !== remoteCurrent?.version) {
      return this.resolveConflict(localCurrent, doc)
    }

    // No conflict, apply directly
    this.localHistory.record(doc, {
      metadata: { author, type: 'remote_apply' }
    })

    return doc
  }

  private resolveConflict(local: CollaborativeDoc, remote: CollaborativeDoc) {
    // Create conflict resolution branch
    const conflictBranch = `conflict-${Date.now()}`
    this.localHistory.createBranch(conflictBranch)
    this.localHistory.switchBranch(conflictBranch)

    // Merge strategy: combine changes
    const mergedDoc: CollaborativeDoc = {
      id: local.id,
      content: this.mergeContent(local.content, remote.content),
      version: Math.max(local.version, remote.version) + 1,
      authors: [...new Set([...local.authors, ...remote.authors])]
    }

    this.localHistory.record(mergedDoc, {
      metadata: {
        type: 'conflict_resolution',
        localVersion: local.version,
        remoteVersion: remote.version
      }
    })

    return mergedDoc
  }

  private mergeContent(local: string, remote: string): string {
    // Simplified merge - in practice would use proper diff/merge algorithms
    if (local === remote) return local
    
    return `${local}\n\n--- CONFLICT RESOLUTION ---\n${remote}`
  }

  // Get conflict history
  getConflicts() {
    return this.localHistory.query(entry =>
      entry.metadata?.type === 'conflict_resolution'
    )
  }

  // Switch to main timeline
  resolveConflictToMain() {
    const current = this.localHistory.getCurrent()
    this.localHistory.switchBranch('main')
    
    if (current) {
      this.localHistory.record(current.data, {
        metadata: { type: 'conflict_resolved' }
      })
    }
  }
}

// Usage examples
export function runExamples() {
  console.log('=== Document Editor Example ===')
  const doc = new DocumentEditor({
    title: 'My Document',
    content: 'Initial content',
    lastModified: new Date()
  })

  doc.updateTitle('Updated Title')
  doc.updateContent('New content here')
  
  const draftBranch = doc.createDraft()
  doc.updateContent('Draft content')
  
  console.log('Current:', doc.getCurrent())
  console.log('History:', doc.getRevisionHistory())

  console.log('\n=== Game History Example ===')
  const game = new GameHistoryManager()
  
  const gameSnapshot: GameSnapshot = {
    state: GameState.PLAYING,
    score: 1000,
    level: 2,
    playerPosition: { x: 50, y: 100 },
    enemies: [
      { id: '1', x: 200, y: 150, health: 100 }
    ]
  }

  game.record(gameSnapshot, true) // Save point
  console.log('Save points:', game.getSavePoints())

  console.log('\n=== Collaborative Editor Example ===')
  const collab = new CollaborativeEditor({
    id: 'doc1',
    content: 'Shared document',
    version: 1,
    authors: ['alice']
  })

  collab.edit('Alice edited this', 'alice')
  collab.applyRemoteChange({
    id: 'doc1',
    content: 'Bob edited this',
    version: 2,
    authors: ['bob']
  }, 'bob')

  console.log('Conflicts:', collab.getConflicts())
}

export {
  DocumentEditor,
  GameHistoryManager,
  CollaborativeEditor,
  GameState,
  type Document,
  type GameSnapshot,
  type CollaborativeDoc
}