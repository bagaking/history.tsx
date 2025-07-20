import { Branch } from '../types'

export class CursorManager<T = any> {
  private _cursor = -1
  private _isValidated = false

  get cursor(): number {
    return this._cursor
  }

  set cursor(value: number) {
    this._cursor = value
    this._isValidated = true
  }

  getValidatedCursor(getCurrentBranch: () => Branch<T> | undefined): number {
    if (!this._isValidated) {
      this.validateAndFix(getCurrentBranch)
    }
    return this._cursor
  }

  invalidate(): void {
    this._isValidated = false
  }

  private validateAndFix(getCurrentBranch: () => Branch<T> | undefined): void {
    const branch = getCurrentBranch()
    if (!branch) {
      this._cursor = -1
    } else {
      // Auto-fix cursor to valid range [-1, entries.length - 1]
      this._cursor = Math.max(-1, Math.min(this._cursor, branch.entries.length - 1))
    }
    this._isValidated = true
  }

  canUndo(getCurrentBranch: () => Branch<T> | undefined): boolean {
    const branch = getCurrentBranch()
    const validCursor = this.getValidatedCursor(getCurrentBranch)
    // Only allow undo if there's more than one entry, or cursor > 0
    return branch ? validCursor > 0 && branch.entries.length > 0 : false
  }

  canRedo(getCurrentBranch: () => Branch<T> | undefined): boolean {
    const branch = getCurrentBranch()
    const validCursor = this.getValidatedCursor(getCurrentBranch)
    return branch ? validCursor < branch.entries.length - 1 : false
  }

  reset(): void {
    this._cursor = -1
    this._isValidated = true
  }
}