import { Branch, HistoryEntry } from '../types'

export class BranchManager<T = any> {
  private branches = new Map<string, Branch<T>>()
  private activeBranchName = 'main'

  constructor() {
    this.initializeMainBranch()
  }

  private initializeMainBranch(): void {
    this.branches.set('main', {
      name: 'main',
      entries: [],
      createdAt: new Date()
    })
  }

  getCurrentBranch(): Branch<T> | undefined {
    return this.branches.get(this.activeBranchName)
  }

  getBranch(name: string): Branch<T> | undefined {
    return this.branches.get(name)
  }

  getAllBranches(): Map<string, Branch<T>> {
    return new Map(this.branches)
  }

  getActiveBranchName(): string {
    return this.activeBranchName
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

    return true
  }

  switchBranch(name: string): boolean {
    const branch = this.branches.get(name)
    if (!branch) return false
    
    this.activeBranchName = name
    return true
  }

  updateBranch(name: string, entries: HistoryEntry<T>[]): boolean {
    const branch = this.branches.get(name)
    if (!branch) return false

    this.branches.set(name, {
      ...branch,
      entries: [...entries]
    })
    return true
  }

  addEntryToBranch(branchName: string, entry: HistoryEntry<T>): boolean {
    const branch = this.branches.get(branchName)
    if (!branch) return false

    const newEntries = [...branch.entries, entry]
    this.branches.set(branchName, {
      ...branch,
      entries: newEntries
    })
    return true
  }

  truncateBranch(branchName: string, keepCount: number): boolean {
    const branch = this.branches.get(branchName)
    if (!branch) return false

    const newEntries = branch.entries.slice(0, keepCount)
    this.branches.set(branchName, {
      ...branch,
      entries: newEntries
    })
    return true
  }

  cleanupBranch(branchName: string, maxEntries: number): number {
    const branch = this.branches.get(branchName)
    if (!branch) return 0

    const excess = branch.entries.length - maxEntries
    if (excess > 0) {
      const newEntries = branch.entries.slice(excess)
      this.branches.set(branchName, {
        ...branch,
        entries: newEntries
      })
      return excess
    }
    return 0
  }

  autoCreateBranch(fromHash: string, branchEntries?: HistoryEntry<T>[]): string {
    const timestamp = Date.now()
    const branchName = `branch-${timestamp}`
    this.createBranch(branchName, fromHash)
    
    if (branchEntries && branchEntries.length > 0) {
      const updatedEntries = branchEntries.map((entry, index) => ({
        ...entry,
        branchName,
        position: index
      }))
      
      this.updateBranch(branchName, updatedEntries)
    }
    
    return branchName
  }

  findEntryInAllBranches(hash: string): { entry: HistoryEntry<T>; branchName: string; index: number } | null {
    for (const [branchName, branch] of this.branches) {
      const entryIndex = branch.entries.findIndex(e => e.hash === hash)
      if (entryIndex !== -1) {
        return {
          entry: branch.entries[entryIndex],
          branchName,
          index: entryIndex
        }
      }
    }
    return null
  }

  clear(): void {
    this.branches.clear()
    this.activeBranchName = 'main'
    this.initializeMainBranch()
  }
}