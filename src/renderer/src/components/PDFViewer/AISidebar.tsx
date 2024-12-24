import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AISidebarProps {
  currentPage: number
  pageContent?: string
}

export default function AISidebar({ currentPage, pageContent }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
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
    // Fetch available models when component mounts
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !selectedModel) return

    const userMessage = {
      role: 'user' as const,
      content: input
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await window.electron.ipcRenderer.invoke('chat-with-ollama', {
        message: input,
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
              {Array.isArray(models) &&
                models.map((modelName: string) => (
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

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this page..."
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!selectedModel}
          />
          <button
            type="submit"
            disabled={isLoading || !selectedModel}
            className="p-2 bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
