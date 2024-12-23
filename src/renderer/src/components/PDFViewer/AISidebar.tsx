import { useState, useRef, useEffect } from 'react'
import {
  ChevronDownIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  PencilIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  ArrowsPointingOutIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AISidebarProps {
  currentPage: number
  pageContent?: string
  currentChapter: {
    title: string
    startPage: number
    endPage: number
  } | null
}

interface ActionButton {
  id: string
  label: string
  prompt: string
  icon: JSX.Element
}

const actionButtons: ActionButton[] = [
  {
    id: 'summarize-page',
    label: 'Summarize Page',
    prompt: 'Please provide a concise summary of this page in 3-4 key points.',
    icon: <DocumentTextIcon className="w-5 h-5" />
  },
  {
    id: 'explain-page',
    label: 'Explain Content',
    prompt: 'Please explain the main concepts on this page in simple terms.',
    icon: <AcademicCapIcon className="w-5 h-5" />
  },
  {
    id: 'create-quiz',
    label: 'Generate Quiz',
    prompt: 'Create 3 quiz questions based on the content of this page, including answers.',
    icon: <QuestionMarkCircleIcon className="w-5 h-5" />
  },
  {
    id: 'key-concepts',
    label: 'Key Concepts',
    prompt: 'List and briefly explain the key concepts mentioned on this page.',
    icon: <LightBulbIcon className="w-5 h-5" />
  },
  {
    id: 'study-notes',
    label: 'Create Study Notes',
    prompt: "Generate detailed study notes from this page's content.",
    icon: <PencilIcon className="w-5 h-5" />
  }
]

const chapterActionButtons: ActionButton[] = [
  {
    id: 'chapter-summary',
    label: 'Chapter Summary',
    prompt: 'Please provide a comprehensive summary of the current chapter.',
    icon: <BookOpenIcon className="w-5 h-5" />
  },
  {
    id: 'chapter-quiz',
    label: 'Chapter Quiz',
    prompt: 'Generate a set of 5 quiz questions covering the key concepts from this chapter.',
    icon: <AcademicCapIcon className="w-5 h-5" />
  },
  {
    id: 'chapter-concepts',
    label: 'Chapter Concepts',
    prompt: 'List and explain all major concepts introduced in this chapter.',
    icon: <LightBulbIcon className="w-5 h-5" />
  },
  {
    id: 'chapter-flashcards',
    label: 'Generate Flashcards',
    prompt:
      'Create a set of flashcards covering the important terms and concepts from this chapter.',
    icon: <DocumentDuplicateIcon className="w-5 h-5" />
  },
  {
    id: 'chapter-study-guide',
    label: 'Study Guide',
    prompt:
      'Create a detailed study guide for this chapter, including main topics, key points, and important relationships.',
    icon: <ClipboardDocumentListIcon className="w-5 h-5" />
  }
]

const bookActionButtons: ActionButton[] = [
  {
    id: 'book-overview',
    label: 'Book Overview',
    prompt:
      'Provide a comprehensive overview of the entire book, including main themes and key takeaways.',
    icon: <BookOpenIcon className="w-5 h-5" />
  },
  {
    id: 'book-themes',
    label: 'Major Themes',
    prompt: 'Analyze and explain the major themes and concepts that run throughout the book.',
    icon: <LightBulbIcon className="w-5 h-5" />
  },
  {
    id: 'chapter-relationships',
    label: 'Chapter Relationships',
    prompt:
      'Explain how different chapters relate to each other and how concepts evolve throughout the book.',
    icon: <ArrowsPointingOutIcon className="w-5 h-5" />
  },
  {
    id: 'book-summary',
    label: 'Executive Summary',
    prompt:
      'Create an executive summary of the entire book, highlighting the most important points from each chapter.',
    icon: <DocumentTextIcon className="w-5 h-5" />
  },
  {
    id: 'study-plan',
    label: 'Study Plan',
    prompt:
      'Create a comprehensive study plan for mastering the content of this book, including chapter dependencies and key focus areas.',
    icon: <AcademicCapIcon className="w-5 h-5" />
  }
]

export default function AISidebar({ currentPage, pageContent, currentChapter }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'page' | 'chapter' | 'book'>('page')
  const [customPrompt, setCustomPrompt] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const availableModels = await window.electron.ipcRenderer.invoke('get-ollama-models')
        setModels(availableModels)
        if (availableModels.length > 0) {
          setSelectedModel(availableModels[0])
        }
      } catch (error) {
        console.error('Error fetching models:', error)
      }
    }
    fetchModels()
  }, [])

  const handleActionClick = async (action: ActionButton) => {
    if (isLoading || !selectedModel) return

    const userMessage = {
      role: 'user' as const,
      content: action.prompt
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await window.electron.ipcRenderer.invoke('chat-with-ollama', {
        message: action.prompt,
        context: pageContent || '',
        pageNumber: currentPage,
        model: selectedModel,
        isChapterAction: activeTab === 'chapter',
        isBookAction: activeTab === 'book'
      })

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response
        }
      ])
    } catch (error) {
      console.error('Error chatting with Ollama:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomPrompt = async () => {
    if (isLoading || !selectedModel || !customPrompt.trim()) return

    const userMessage = {
      role: 'user' as const,
      content: customPrompt
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await window.electron.ipcRenderer.invoke('chat-with-ollama', {
        message: customPrompt,
        context: pageContent || '',
        pageNumber: currentPage,
        model: selectedModel,
        isChapterAction: activeTab === 'chapter',
        isBookAction: activeTab === 'book'
      })

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response
        }
      ])
      setCustomPrompt('')
    } catch (error) {
      console.error('Error chatting with Ollama:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('Current Chapter:', currentChapter)
  }, [currentChapter])

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <div className="relative mt-2">
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <span className="text-sm">{selectedModel || 'Select Model'}</span>
            <ChevronDownIcon className="w-5 h-5" />
          </button>
          {isModelDropdownOpen && (
            <div className="absolute w-full mt-1 bg-gray-700 rounded-lg shadow-lg z-50">
              {models.map((modelName) => (
                <button
                  key={modelName}
                  onClick={() => {
                    setSelectedModel(modelName)
                    setIsModelDropdownOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg text-sm"
                >
                  {modelName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('page')}
          className={`flex-1 p-2 text-sm font-medium ${
            activeTab === 'page' ? 'border-b-2 border-blue-500' : ''
          } hover:bg-gray-700/50 transition-colors`}
        >
          Page Actions
        </button>
        <button
          onClick={() => setActiveTab('chapter')}
          className={`flex-1 p-2 text-sm font-medium ${
            activeTab === 'chapter' ? 'border-b-2 border-blue-500' : ''
          } ${!currentChapter ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/50'} transition-colors`}
          disabled={!currentChapter}
          title={!currentChapter ? 'No chapter detected for current page' : ''}
        >
          Chapter Actions
        </button>
        <button
          onClick={() => setActiveTab('book')}
          className={`flex-1 p-2 text-sm font-medium ${
            activeTab === 'book' ? 'border-b-2 border-blue-500' : ''
          } hover:bg-gray-700/50 transition-colors`}
        >
          Book Actions
        </button>
      </div>

      <div className="p-4 space-y-2">
        {activeTab === 'page' ? (
          actionButtons.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={isLoading || !selectedModel}
              className="flex items-center gap-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 
                       disabled:opacity-50 disabled:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </button>
          ))
        ) : activeTab === 'chapter' ? (
          <>
            {currentChapter && (
              <div className="mb-4 p-2 bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium">Current Chapter:</h3>
                <p className="text-sm opacity-80">{currentChapter.title}</p>
                <p className="text-xs opacity-60">
                  Pages {currentChapter.startPage} - {currentChapter.endPage}
                </p>
              </div>
            )}
            {chapterActionButtons.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={isLoading || !selectedModel || !currentChapter}
                className="flex items-center gap-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 
                         disabled:opacity-50 disabled:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {action.icon}
                <span className="text-sm">{action.label}</span>
              </button>
            ))}
          </>
        ) : (
          bookActionButtons.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={isLoading || !selectedModel}
              className="flex items-center gap-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 
                       disabled:opacity-50 disabled:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'user' ? 'bg-blue-500/20' : 'bg-gray-700/50'
            }`}
          >
            <div className="text-xs font-medium mb-1">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="text-sm prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        {...props}
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code {...props} className={className}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCustomPrompt()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ask anything about the content..."
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || !selectedModel}
          />
          <button
            type="submit"
            disabled={isLoading || !selectedModel || !customPrompt.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 rounded-lg transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
