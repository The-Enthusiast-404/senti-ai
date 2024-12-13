import { useState, useEffect } from 'react'
import ModelSelector from '../ModelSelector/ModelSelector'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentModel, setCurrentModel] = useState<string>('llama2')
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const response = await window.api.getChats()
      if (response.success && response.data) {
        setChats(response.data)
      }
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  }

  const loadChat = async (chatId: string) => {
    try {
      const response = await window.api.getChatMessages(chatId)
      if (response.success && response.data) {
        setMessages(
          response.data.map((msg) => ({
            role: msg.role,
            content: msg.content
          }))
        )
        setCurrentChatId(chatId)

        // Find the chat in chats array and set its model
        const chat = chats.find((c) => c.id === chatId)
        if (chat) {
          setCurrentModel(chat.model)
          await window.api.setModel(chat.model)
        }
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setCurrentChatId(null)
  }

  const handleModelSelect = async (model: string) => {
    try {
      const response = await window.api.setModel(model)
      if (!response.success) {
        throw new Error(response.error || 'Failed to set model')
      }
      setCurrentModel(model)
    } catch (error) {
      console.error('Failed to switch model:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user' as const, content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await window.api.chat({
        chatId: currentChatId,
        messages: [...messages, userMessage]
      })

      if (response.success && response.data?.content && response.data?.chatId) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.data!.content }])
        setCurrentChatId(response.data.chatId)
        await loadChats() // Refresh chat list
      } else {
        throw new Error(response.error || 'Failed to get response')
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Chat History Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-800 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Chat
          </button>
          <div className="mt-4 space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left p-2 rounded-lg hover:bg-gray-700 ${
                  currentChatId === chat.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="truncate text-sm text-gray-200">{chat.title}</div>
                <div className="text-xs text-gray-400">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-700 p-4 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 p-2 hover:bg-gray-700 rounded-lg"
          >
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <ModelSelector onModelSelect={handleModelSelect} currentModel={currentModel} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-700 text-gray-100">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLoading
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
