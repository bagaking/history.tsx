import React, { useState } from 'react'
import { useHistory, useUndo } from '@bagaking/history.tsx'

// Modern UI Components with Tailwind
const Card = ({ children, title, subtitle }: { 
  children: React.ReactNode
  title: string
  subtitle?: string
}) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
)

const Button = ({ 
  onClick, 
  disabled, 
  children, 
  variant = 'primary',
  size = 'md',
  className = ''
}: any) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300",
    success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500"
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// Demo 1: 智能文档编辑器 (类似 Notion/HuggingFace 的文档编辑)
function DocumentEditorDemo() {
  const history = useHistory<{ title: string, content: string }>({
    initialData: {
      title: '📘 AI 模型开发指南',
      content: `# 深度学习模型开发最佳实践

## 数据预处理
- 清理和标准化数据
- 特征工程和选择
- 数据增强技术

## 模型架构设计
选择合适的网络架构是成功的关键...

## 训练策略
- 学习率调度
- 批量大小优化
- 正则化技术

---
💡 这是一个支持实时协作和版本控制的文档编辑器。每次修改都会自动保存到历史记录中。`
    },
    debounceDelay: 800
  })

  const currentDoc = history.current || { title: '', content: '' }

  return (
    <Card 
      title="📝 智能文档编辑器" 
      subtitle="支持版本控制和协作编辑的现代文档系统"
    >
      {/* 工具栏 */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <Button onClick={history.undo} disabled={!history.canUndo} size="sm">
          ↶ 撤销
        </Button>
        <Button onClick={history.redo} disabled={!history.canRedo} size="sm">
          ↷ 重做
        </Button>
        <Button onClick={history.clear} variant="secondary" size="sm">
          🗑️ 清空历史
        </Button>
        <div className="flex-1"></div>
        <span className="text-xs text-gray-500 self-center">
          自动保存 • {history.state.branches.get(history.state.activeBranch)?.entries.length || 0} 个版本
        </span>
      </div>

      {/* 文档标题 */}
      <div className="mb-4">
        <input
          type="text"
          value={currentDoc.title}
          onChange={(e) => history.record({
            ...currentDoc,
            title: e.target.value
          })}
          className="w-full text-2xl font-bold border-none outline-none focus:ring-0 bg-transparent placeholder-gray-400"
          placeholder="文档标题..."
        />
      </div>

      {/* 文档内容 */}
      <div className="mb-4">
        <textarea
          value={currentDoc.content}
          onChange={(e) => history.record({
            ...currentDoc,
            content: e.target.value
          })}
          placeholder="开始写作... 支持 Markdown 语法"
          className="w-full h-80 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
        />
      </div>

      {/* 状态栏 */}
      <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="flex gap-4">
          <span>分支: <strong className="text-blue-600">{history.state.activeBranch}</strong></span>
          <span>字数: <strong>{currentDoc.content.length}</strong></span>
          <span>版本: <strong>{history.state.cursor + 1}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>已保存</span>
        </div>
      </div>
    </Card>
  )
}

// Demo 2: 代码片段管理器 (类似 GitHub Gist)
interface CodeSnippet {
  id: string
  filename: string
  language: string
  code: string
  description: string
  tags: string[]
}

function CodeSnippetManager() {
  const history = useHistory<{ snippets: CodeSnippet[] }>({
    initialData: { 
      snippets: [
        {
          id: '1',
          filename: 'fibonacci.py',
          language: 'python',
          code: `def fibonacci(n):
    """计算斐波那契数列的第n项"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 优化版本 - 使用记忆化
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_optimized(n):
    if n <= 1:
        return n
    return fibonacci_optimized(n-1) + fibonacci_optimized(n-2)`,
          description: '经典斐波那契数列实现 - 递归和优化版本',
          tags: ['算法', 'Python', '递归', '动态规划']
        }
      ] 
    },
    debounceDelay: 500
  })

  const [newSnippet, setNewSnippet] = useState<Partial<CodeSnippet>>({
    filename: '',
    language: 'javascript',
    code: '',
    description: '',
    tags: []
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const currentState = history.current || { snippets: [] }

  const addSnippet = () => {
    if (!newSnippet.filename || !newSnippet.code) return

    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      filename: newSnippet.filename!,
      language: newSnippet.language || 'javascript',
      code: newSnippet.code!,
      description: newSnippet.description || '',
      tags: newSnippet.tags || []
    }

    history.record({
      snippets: [...currentState.snippets, snippet]
    }, {
      metadata: { action: 'add_snippet', filename: snippet.filename }
    })

    setNewSnippet({ filename: '', language: 'javascript', code: '', description: '', tags: [] })
  }

  const deleteSnippet = (id: string) => {
    history.record({
      snippets: currentState.snippets.filter(s => s.id !== id)
    }, {
      metadata: { action: 'delete_snippet', snippetId: id }
    })
  }

  return (
    <Card 
      title="💻 代码片段管理器" 
      subtitle="管理和版本控制你的代码片段集合"
    >
      {/* 操作栏 */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <Button onClick={history.undo} disabled={!history.canUndo} size="sm">
          ↶ 撤销
        </Button>
        <Button onClick={history.redo} disabled={!history.canRedo} size="sm">
          ↷ 重做
        </Button>
        <div className="flex-1"></div>
        <span className="text-xs text-gray-500 self-center">
          {currentState.snippets.length} 个代码片段
        </span>
      </div>

      {/* 添加新片段 */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50">
        <h4 className="font-medium mb-3 text-gray-900">添加新的代码片段</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="文件名 (例: utils.js)"
            value={newSnippet.filename || ''}
            onChange={(e) => setNewSnippet({ ...newSnippet, filename: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={newSnippet.language || 'javascript'}
            onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="react">React JSX</option>
            <option value="css">CSS</option>
            <option value="html">HTML</option>
          </select>
        </div>
        <textarea
          placeholder="粘贴你的代码..."
          value={newSnippet.code || ''}
          onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
          className="w-full h-32 mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
        <input
          type="text"
          placeholder="描述 (可选)"
          value={newSnippet.description || ''}
          onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Button onClick={addSnippet} size="sm">
          ➕ 添加片段
        </Button>
      </div>

      {/* 片段列表 */}
      <div className="space-y-4">
        {currentState.snippets.map((snippet) => (
          <div key={snippet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium text-gray-900 flex items-center gap-2">
                  📄 {snippet.filename}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {snippet.language}
                  </span>
                </h5>
                {snippet.description && (
                  <p className="text-sm text-gray-600 mt-1">{snippet.description}</p>
                )}
              </div>
              <Button 
                onClick={() => deleteSnippet(snippet.id)} 
                variant="danger" 
                size="sm"
              >
                🗑️
              </Button>
            </div>
            
            <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto text-sm font-mono border">
              <code>{snippet.code}</code>
            </pre>
            
            {snippet.tags.length > 0 && (
              <div className="flex gap-1 mt-3">
                {snippet.tags.map((tag, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentState.snippets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p>还没有代码片段</p>
          <p className="text-sm">添加你的第一个代码片段开始管理你的代码库</p>
        </div>
      )}
    </Card>
  )
}

// Demo 3: AI 对话历史管理器 (类似 ChatGPT)
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  model: string
}

function AIChat() {
  const history = useHistory<{ sessions: ChatSession[], activeSessionId: string | null }>({
    initialData: { 
      sessions: [
        {
          id: '1',
          title: '代码重构建议',
          model: 'Claude 3.5 Sonnet',
          messages: [
            {
              id: '1',
              role: 'user',
              content: '请帮我重构这段React组件，让它更加现代化和可读性更好。',
              timestamp: new Date()
            },
            {
              id: '2',
              role: 'assistant',
              content: '我很乐意帮你重构React组件！请分享你想要重构的代码，我会提供现代化的改进建议，包括：\n\n• 使用函数组件和Hooks\n• 改进状态管理\n• 提升性能\n• 增强类型安全\n• 优化代码结构',
              timestamp: new Date()
            }
          ]
        }
      ],
      activeSessionId: '1'
    },
    debounceDelay: 300
  })

  const [newMessage, setNewMessage] = useState('')
  const currentState = history.current || { sessions: [], activeSessionId: null }
  const activeSession = currentState.sessions.find(s => s.id === currentState.activeSessionId)

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      model: 'Claude 3.5 Sonnet',
      messages: []
    }

    history.record({
      sessions: [...currentState.sessions, newSession],
      activeSessionId: newSession.id
    }, {
      metadata: { action: 'create_session' }
    })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !activeSession) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    }

    // 模拟AI回复
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '这是一个演示回复。在真实应用中，这里会是AI模型的实际响应。History.tsx 可以完美管理整个对话的版本历史！',
      timestamp: new Date()
    }

    const updatedSessions = currentState.sessions.map(session =>
      session.id === activeSession.id
        ? { ...session, messages: [...session.messages, userMessage, aiMessage] }
        : session
    )

    history.record({
      sessions: updatedSessions,
      activeSessionId: currentState.activeSessionId
    }, {
      metadata: { action: 'send_message', messageContent: newMessage.trim() }
    })

    setNewMessage('')
  }

  return (
    <Card 
      title="🤖 AI 对话管理器" 
      subtitle="智能对话系统，支持多会话和完整历史记录"
    >
      <div className="flex h-96">
        {/* 会话列表 */}
        <div className="w-1/3 border-r border-gray-200 pr-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">对话列表</h4>
            <Button onClick={createNewSession} size="sm">
              ➕ 新对话
            </Button>
          </div>
          
          <div className="space-y-2">
            {currentState.sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => history.record({
                  ...currentState,
                  activeSessionId: session.id
                })}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  session.id === currentState.activeSessionId
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm text-gray-900 truncate">
                  {session.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {session.messages.length} 条消息 • {session.model}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 对话内容 */}
        <div className="flex-1 pl-4 flex flex-col">
          {activeSession ? (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {activeSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 输入框 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  发送
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p>选择一个对话开始聊天</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 历史控制 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={history.undo} disabled={!history.canUndo} size="sm">
              ↶ 撤销
            </Button>
            <Button onClick={history.redo} disabled={!history.canRedo} size="sm">
              ↷ 重做
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            {currentState.sessions.length} 个会话 • 版本 {history.state.cursor + 1}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 主应用
export default function App() {
  const [activeDemo, setActiveDemo] = useState('document')

  const demos = {
    'document': { component: DocumentEditorDemo, name: '📝 文档编辑器', desc: '智能协作文档系统' },
    'code': { component: CodeSnippetManager, name: '💻 代码管理', desc: '代码片段版本控制' },
    'chat': { component: AIChat, name: '🤖 AI 对话', desc: '智能对话历史管理' }
  }

  const DemoComponent = demos[activeDemo as keyof typeof demos].component

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="gradient-brand text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              History.tsx 🚀
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              优雅的 TypeScript undo/redo 管理系统
            </p>
            <p className="text-lg opacity-75 mt-2">
              支持分支管理、时间旅行和 React 集成
            </p>
          </div>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {Object.entries(demos).map(([key, demo]) => (
              <button
                key={key}
                onClick={() => setActiveDemo(key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeDemo === key
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{demo.name}</span>
                <span className="text-xs text-gray-500">{demo.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 演示内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DemoComponent />
      </div>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            Built with ❤️ using{' '}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              History.tsx
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <a href="https://github.com/bagaking/history.tsx" className="hover:text-blue-600 transition-colors">
              View on GitHub
            </a>
            {' • '}
            <a href="https://www.npmjs.com/package/@bagaking/history.tsx" className="hover:text-blue-600 transition-colors">
              NPM Package
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}