import HistoryManager, {
  UniversalHistoryManager,
  createEventEmitter,
  debounce,
  deepClone,
  generateHash,
  useHistory,
  useHistoryEvents,
  useHistoryState,
  useUndo
} from '../index'

const packageJson = require('../../package.json') as {
  main: string
  types: string
  files: string[]
}

describe('package entry', () => {
  const distFilesGlob = ['dist', '**', '*'].join('/')

  test('exports the public API from the root entry point', () => {
    expect(HistoryManager).toBe(UniversalHistoryManager)
    expect(new UniversalHistoryManager()).toBeInstanceOf(UniversalHistoryManager)

    expect(typeof useHistory).toBe('function')
    expect(typeof useUndo).toBe('function')
    expect(typeof useHistoryState).toBe('function')
    expect(typeof useHistoryEvents).toBe('function')

    expect(typeof generateHash).toBe('function')
    expect(typeof deepClone).toBe('function')
    expect(typeof debounce).toBe('function')
    expect(typeof createEventEmitter).toBe('function')
  })

  test('keeps package metadata aligned with the built root entry', () => {
    expect(packageJson.main).toBe('dist/index.js')
    expect(packageJson.types).toBe('dist/index.d.ts')
    expect(packageJson.files).toEqual(
      expect.arrayContaining([distFilesGlob, 'README.md', 'LICENSE', 'CHANGELOG.md'])
    )
  })
})
