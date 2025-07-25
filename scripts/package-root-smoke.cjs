'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const packageRoot = path.resolve(__dirname, '..')
const packageJson = require(path.join(packageRoot, 'package.json'))
const distEntryPath = path.join(packageRoot, packageJson.main)
const typesEntryPath = path.join(packageRoot, packageJson.types)

const packageEntry = require(packageRoot)
const distEntry = require(distEntryPath)

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

assert.equal(packageJson.main, 'dist/index.js')
assert.equal(packageJson.types, 'dist/index.d.ts')
assert.equal(fs.existsSync(distEntryPath), true)
assert.equal(fs.existsSync(typesEntryPath), true)

for (const exportName of expectedFunctionExports) {
  assert.equal(typeof packageEntry[exportName], 'function', `package root export ${exportName}`)
  assert.equal(packageEntry[exportName], distEntry[exportName], `package root should re-export ${exportName} from dist`)
}

assert.equal(packageEntry.default, packageEntry.UniversalHistoryManager)
assert.ok(new packageEntry.UniversalHistoryManager())

console.log('package root smoke passed')
