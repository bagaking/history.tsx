const createBase64Hash = (content: string): string => {
  // Use Buffer in Node.js environment, btoa in browser
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(content).toString('base64')
  } else if (typeof btoa !== 'undefined') {
    return btoa(content)
  } else {
    // Fallback: simple string encoding
    return content.split('').map(c => c.charCodeAt(0).toString(16)).join('')
  }
}

export const generateHash = (data: any, timestamp: Date, parentHash?: string): string => {
  const content = JSON.stringify({ data, timestamp: timestamp.getTime(), parentHash })
  const hash = createBase64Hash(content).slice(0, 16)
  return hash.replace(/[+/]/g, (x: string) => x === '+' ? '-' : '_')
}

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

export const debounce = <T extends any[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export const createEventEmitter = <T>() => {
  const listeners = new Set<(event: T) => void>()
  
  return {
    on: (listener: (event: T) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    emit: (event: T) => {
      listeners.forEach(listener => listener(event))
    },
    clear: () => listeners.clear()
  }
}