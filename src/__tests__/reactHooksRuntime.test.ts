const missingReactMessage = '@bagaking/history.tsx React hooks require react to be installed'

const captureError = (action: () => void): unknown => {
  try {
    action()
  } catch (error) {
    return error
  }

  throw new Error('Expected action to throw')
}

describe('React hook runtime loading', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    jest.resetModules()
  })

  test('throws install guidance when a hook is called without react', () => {
    jest.isolateModules(() => {
      const { useHistory } = require('../react/hooks') as typeof import('../react/hooks')

      expect(() => useHistory()).toThrow(missingReactMessage)
    })
  })

  test('rethrows react initialization errors without rewriting them', () => {
    const reactInitError = new Error('react failed during initialization')

    jest.doMock('react', () => {
      throw reactInitError
    }, { virtual: true })

    jest.isolateModules(() => {
      const { useHistory } = require('../react/hooks') as typeof import('../react/hooks')

      expect(captureError(() => useHistory())).toBe(reactInitError)
    })
  })

  test('rethrows nested module resolution errors from react', () => {
    const nestedModuleError = Object.assign(
      new Error("Cannot find module 'react/jsx-runtime'"),
      { code: 'MODULE_NOT_FOUND' }
    )

    jest.doMock('react', () => {
      throw nestedModuleError
    }, { virtual: true })

    jest.isolateModules(() => {
      const { useHistory } = require('../react/hooks') as typeof import('../react/hooks')

      expect(captureError(() => useHistory())).toBe(nestedModuleError)
    })
  })

  test('loads hooks with a mocked react runtime', () => {
    const forceUpdate = jest.fn()
    const reactMock = {
      useCallback: jest.fn((callback: unknown) => callback),
      useEffect: jest.fn(),
      useRef: jest.fn(() => ({ current: undefined })),
      useState: jest.fn((initialState: unknown) => [initialState, forceUpdate])
    }

    jest.doMock('react', () => reactMock, { virtual: true })

    jest.isolateModules(() => {
      const { useHistory } = require('../react/hooks') as typeof import('../react/hooks')
      const history = useHistory<{ value: string }>()

      expect(history.current).toBeNull()
      expect(history.canUndo).toBe(false)
      expect(typeof history.record).toBe('function')
      expect(typeof history.record({ value: 'present' }, { debounce: false })).toBe('string')
    })

    expect(reactMock.useRef).toHaveBeenCalledTimes(1)
    expect(reactMock.useState).toHaveBeenCalled()
    expect(reactMock.useCallback).toHaveBeenCalled()
    expect(reactMock.useEffect).toHaveBeenCalled()
  })
})
