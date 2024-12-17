import { useState, useEffect } from 'react'
import ModelSelector from '../ModelSelector/ModelSelector'
import MessageContent from './MessageContent'
import ImageUpload from './ImageUpload'
import FileUpload from './FileUpload'
import ContextSources from './ContextSources'
import SystemPromptManager from '../SystemPrompts/SystemPromptManager'
import CodeGenerator from '../CodeGeneration/CodeGenerator'
import StockViewer from '../Stocks/StockViewer'
import { useChatStore } from '../../stores/chatStore'
import { useTabStore } from '../../stores/tabStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'image'
}

interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
}

interface SystemPrompt {
  id: string
  name: string
  content: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

interface ChatInterfaceProps {
  tabId: string
}

export default function ChatInterface({ tabId }: ChatInterfaceProps) {
  const { updateTabState, getTabState } = useTabStore()
  const tabState = getTabState(tabId)
  const { chats, loadChats } = useChatStore()

  const [input, setInput] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [ragMode, setRagMode] = useState<'none' | 'files' | 'web'>('none')
  const [processedFiles, setProcessedFiles] = useState<Array<{ id: string; filename: string }>>([])
  const [showSystemPrompts, setShowSystemPrompts] = useState(false)
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<SystemPrompt | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const createNewChat = async () => {
    const { createTab } = useTabStore.getState()
    const newTab = createTab('chat', 'New Chat')
    updateTabState(newTab.id, {
      messages: [],
      currentChatId: null,
      isLoading: false,
      currentModel: 'llama2'
    })
    await loadChats()
  }

  const loadChat = async (chatId: string) => {
    try {
      updateTabState(tabId, { isLoading: true })
      const response = await window.api.getChatMessages(chatId)
      if (response.success && response.data) {
        const chat = chats.find((c) => c.id === chatId)
        updateTabState(tabId, {
          messages: response.data,
          currentChatId: chatId,
          isLoading: false,
          currentModel: chat?.model || 'llama2'
        })
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error)
      updateTabState(tabId, { isLoading: false })
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      const response = await window.api.deleteChat(chatId)
      if (response.success) {
        const currentState = getTabState(tabId)
        if (currentState.currentChatId === chatId) {
          await createNewChat()
        }
        await loadChats()
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    try {
      const response = await window.api.updateChatTitle(chatId, newTitle)
      if (response.success) {
        // Update tab title if this chat is open in a tab
        const { tabs, updateTabTitle } = useTabStore.getState()
        const tab = tabs.find((t) => t.type === 'chat' && t.state?.currentChatId === chatId)
        if (tab) {
          updateTabTitle(tab.id, newTitle)
        }
        await loadChats()
      }
    } catch (error) {
      console.error('Failed to update chat title:', error)
    }
  }

  const sendMessage = async (content: string, type: 'text' | 'image') => {
    const currentState = getTabState(tabId)
    const userMessage = { role: 'user' as const, content, type }

    updateTabState(tabId, {
      messages: [...currentState.messages, userMessage],
      isLoading: true
    })

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      )

      const responsePromise = window.api.chat({
        chatId: currentState.currentChatId,
        messages: [...currentState.messages, userMessage],
        model: currentState.currentModel
      })

      const response = (await Promise.race([responsePromise, timeoutPromise])) as any

      if (response?.success && response?.data?.content && response?.data?.chatId) {
        // Get the updated chat title from the chats list
        await loadChats()
        const { chats } = useChatStore.getState()
        const updatedChat = chats.find((c) => c.id === response.data.chatId)

        // Update both tab state and title
        const { updateTabTitle } = useTabStore.getState()
        updateTabTitle(tabId, updatedChat?.title || 'New Chat')

        updateTabState(tabId, {
          messages: [
            ...currentState.messages,
            userMessage,
            { role: 'assistant', content: response.data.content, type: 'text' }
          ],
          isLoading: false,
          currentChatId: response.data.chatId
        })
      } else {
        throw new Error(response?.error || 'Invalid response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      updateTabState(tabId, {
        messages: [
          ...currentState.messages,
          userMessage,
          {
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again.',
            type: 'text'
          }
        ],
        isLoading: false
      })
    }
  }

  const handleModelSelect = async (model: string) => {
    try {
      const response = await window.api.setModel(model)
      if (response.success) {
        updateTabState(tabId, { currentModel: model })
      }
    } catch (error) {
      console.error('Failed to switch model:', error)
    }
  }

  const handleSystemPromptSelect = (prompt: SystemPrompt | null) => {
    setSelectedSystemPrompt(prompt)
    setShowSystemPrompts(false)
  }

  const handleImageSelect = async (base64Image: string) => {
    const currentState = getTabState(tabId)
    const userMessage = {
      role: 'user' as const,
      content: base64Image,
      type: 'image' as const
    }
    await sendMessage(base64Image, 'image')
    setShowImageUpload(false)
    setIsLoading(true)

    try {
      const response = await window.api.chat({
        chatId: currentState.currentChatId,
        messages: [...currentState.messages, userMessage],
        model: currentState.currentModel
      })

      if (response.success && response.data?.content && response.data?.chatId) {
        await sendMessage(response.data.content, 'text')
        await loadChats()
      } else {
        throw new Error(response.error || 'Failed to get response')
      }
    } catch (err) {
      console.error('Chat error:', err)
      await sendMessage('Sorry, there was an error processing your request.', 'text')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageGeneration = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await window.api.generateImage(input.trim())

      if (response.success && response.data) {
        const userMessage = {
          role: 'user' as const,
          content: `Generate image: ${input.trim()}`,
          type: 'text' as const
        }

        const assistantMessage = {
          role: 'assistant' as const,
          content: response.data,
          type: 'image' as const
        }

        await sendMessage(response.data, 'image')
        setInput('')
      } else {
        throw new Error(response.error || 'Failed to generate image')
      }
    } catch (err) {
      console.error('Image generation error:', err)
      await sendMessage('Sorry, there was an error generating the image.', 'text')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    try {
      const response = await window.api.processFile(file.path)
      if (response.success && response.data?.filename) {
        setProcessedFiles((prev) => [
          ...prev,
          {
            id: response.data.id,
            filename: response.data.filename
          }
        ])
        await sendMessage(
          `File "${response.data.filename}" has been processed and added to my knowledge base. You can now ask questions about it.`,
          'text'
        )
        // Automatically enable file RAG when a file is uploaded
        setRagMode('files')
      } else {
        throw new Error(response.error || 'Failed to process file')
      }
    } catch (err) {
      console.error('File processing error:', err)
      await sendMessage('Sorry, there was an error processing the file.', 'text')
    } finally {
      setIsLoading(false)
      setShowFileUpload(false)
    }
  }

  const handleRemoveFile = async (fileId: string) => {
    try {
      await window.api.removeProcessedFile(fileId)
      setProcessedFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error('Failed to remove file:', error)
    }
  }

  const toggleSidebar = () => {
    updateTabState(tabId, {
      isSidebarOpen: !tabState.isSidebarOpen
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || tabState.isLoading) return

    const content = selectedSystemPrompt
      ? `${selectedSystemPrompt.content}\n\nUser: ${input}`
      : input

    await sendMessage(content, 'text')
    setInput('')
  }

  const handleChatSelect = async (chat: Chat) => {
    const { tabs, createTab, setActiveTab } = useTabStore.getState()

    // Check if chat is already open in a tab
    const existingTab = tabs.find(
      (tab) => tab.type === 'chat' && tab.state?.currentChatId === chat.id
    )

    if (existingTab) {
      // If chat is already open, just switch to that tab
      setActiveTab(existingTab.id)
    } else {
      // Create new tab for this chat with the chat title
      const newTab = createTab('chat', chat.title)
      updateTabState(newTab.id, { currentChatId: chat.id })
    }

    await loadChat(chat.id)
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Chat History Sidebar */}
      <div
        className={`${
          tabState.isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-800 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Chat
          </button>
          <div className="mt-4 space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex flex-col space-y-1 p-2 rounded hover:bg-gray-700 cursor-pointer ${
                  tabState.currentChatId === chat.id ? 'bg-gray-700' : ''
                }`}
                onClick={() => handleChatSelect(chat)}
                onDoubleClick={() => {
                  setEditingChatId(chat.id)
                  setEditingTitle(chat.title)
                }}
              >
                <div className="flex justify-between items-center">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => {
                        if (editingTitle.trim() && editingTitle !== chat.title) {
                          updateChatTitle(chat.id, editingTitle.trim())
                        }
                        setEditingChatId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingTitle.trim() && editingTitle !== chat.title) {
                            updateChatTitle(chat.id, editingTitle.trim())
                          }
                          setEditingChatId(null)
                        }
                        if (e.key === 'Escape') {
                          setEditingChatId(null)
                        }
                      }}
                      className="bg-gray-700 text-sm text-gray-200 p-1 rounded w-full outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="truncate text-sm text-gray-200 cursor-pointer">
                      {chat.title}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Are you sure you want to delete this chat?')) {
                        deleteChat(chat.id)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-none border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="p-2 hover:bg-gray-700 rounded-lg">
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
            <ModelSelector onModelSelect={handleModelSelect} currentModel={tabState.currentModel} />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Web Search</span>
              <button
                onClick={() => setRagMode(ragMode === 'web' ? 'none' : 'web')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  ragMode === 'web' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ragMode === 'web' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Use Files</span>
              <button
                onClick={() => setRagMode(ragMode === 'files' ? 'none' : 'files')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  ragMode === 'files' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ragMode === 'files' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-none">
          <ContextSources
            webEnabled={ragMode === 'web'}
            filesEnabled={ragMode === 'files'}
            files={processedFiles}
            onRemoveFile={handleRemoveFile}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tabState.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <MessageContent
                  content={message.content}
                  type={message.type}
                  isUser={message.role === 'user'}
                />
              </div>
            </div>
          ))}
          {tabState.isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-700 text-gray-100">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="flex-none border-t border-gray-700 p-4">
          {showFileUpload ? (
            <div className="space-y-4">
              <FileUpload onFileSelect={handleFileSelect} />
              <button
                onClick={() => setShowFileUpload(false)}
                className="w-full py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : showImageUpload ? (
            <div className="space-y-4">
              <ImageUpload onImageSelect={handleImageSelect} />
              <button
                onClick={() => setShowImageUpload(false)}
                className="w-full py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              {selectedSystemPrompt && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-400">
                    Using prompt: {selectedSystemPrompt.name}
                  </span>
                  <button
                    onClick={() => setSelectedSystemPrompt(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2"
                  placeholder="Type your message..."
                  disabled={tabState.isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowFileUpload(true)}
                  className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
                  disabled={tabState.isLoading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageUpload(true)}
                  className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
                  disabled={tabState.isLoading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSystemPrompts(true)}
                  className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
                  disabled={tabState.isLoading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tabState.isLoading
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={tabState.isLoading}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add SystemPromptManager modal */}
      {showSystemPrompts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-3/4 max-h-[80vh] overflow-auto">
            <SystemPromptManager
              onSelectPrompt={handleSystemPromptSelect}
              currentPrompt={selectedSystemPrompt}
            />
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => setShowSystemPrompts(false)}
                className="w-full py-2 text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
