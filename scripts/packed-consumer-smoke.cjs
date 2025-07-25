'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const packageRoot = path.resolve(__dirname, '..')
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'history-tsx-packed-smoke-'))
const packDir = path.join(tempRoot, 'pack')
const consumerDir = path.join(tempRoot, 'consumer')

const run = (command, args, options = {}) => {
  return execFileSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe']
  })
}

try {
  fs.mkdirSync(packDir)
  fs.mkdirSync(consumerDir)

  const packOutput = run('npm', ['pack', '--json', '--pack-destination', packDir], {
    cwd: packageRoot
  })
  const [packResult] = JSON.parse(packOutput)
  assert.ok(packResult && packResult.filename, 'npm pack should report a tarball filename')

  const tarballPath = path.join(packDir, packResult.filename)
  assert.equal(fs.existsSync(tarballPath), true, 'packed tarball should exist in temp pack dir')

  run('npm', ['init', '-y'], { cwd: consumerDir, stdio: 'ignore' })
  run('npm', ['install', tarballPath], { cwd: consumerDir, stdio: 'ignore' })

  const packageEntry = require(path.join(consumerDir, 'node_modules', '@bagaking', 'history.tsx'))
  const expectedFunctionExports = [
    'UniversalHistoryManager',
    'default',
    'generateHash',
    'deepClone',
    'debounce',
    'createEventEmitter',
    'useHistory',
    'useUndo',
    'useHistoryState',
    'useHistoryEvents'
  ]

  for (const exportName of expectedFunctionExports) {
    assert.equal(typeof packageEntry[exportName], 'function', `packed consumer export ${exportName}`)
  }

  assert.equal(packageEntry.default, packageEntry.UniversalHistoryManager)

  const history = new packageEntry.UniversalHistoryManager()
  const firstHash = history.record('first', { debounce: false })
  const secondHash = history.record('second', { debounce: false })

  assert.equal(typeof firstHash, 'string')
  assert.equal(typeof secondHash, 'string')
  assert.equal(history.canUndo(), true)

  history.undo()
  assert.equal(history.getState().current.data, 'first')
  assert.equal(typeof packageEntry.generateHash('core-public-export', new Date(0)), 'string')
  assert.deepEqual(packageEntry.deepClone({ ok: true }), { ok: true })

  console.log('packed consumer smoke passed')
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true })
}
