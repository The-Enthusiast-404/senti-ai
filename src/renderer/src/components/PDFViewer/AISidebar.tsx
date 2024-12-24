import { useState, useRef, useEffect } from 'react'
import {
  ChevronDownIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AISidebarProps {
  currentPage: number
  pageContent?: string
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

export default function AISidebar({ currentPage, pageContent }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        model: selectedModel
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

      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-1 gap-2">
          {actionButtons.map((action) => (
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
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${message.role === 'user' ? 'bg-gray-700' : 'bg-gray-600'} p-3 rounded-lg`}
          >
            <div className="text-sm font-medium mb-1">
              {message.role === 'user' ? 'You' : 'AI Assistant'}
            </div>
            <div className="text-sm">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
