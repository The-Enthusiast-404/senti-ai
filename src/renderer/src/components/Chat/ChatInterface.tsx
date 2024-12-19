import { useState, useEffect } from 'react'
import ModelSelector from '../ModelSelector/ModelSelector'
import MessageContent from './MessageContent'

import SystemPromptManager from '../SystemPrompts/SystemPromptManager'
import { useChatStore } from '../../stores/chatStore'
import { useTabStore } from '../../stores/tabStore'
import { v4 as uuidv4 } from 'uuid'
import FileUploader from '../FileUploader/FileUploader'
import FileList from '../FileList/FileList'
import { Switch } from '../ui/Switch'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'image'
  sources?: Array<{
    title: string
    url: string
    domain: string
  }>
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
  const { chats, loadChats, isInternetSearchEnabled, toggleInternetSearch } = useChatStore()

  const [input, setInput] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showSystemPrompts, setShowSystemPrompts] = useState(false)
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<SystemPrompt | null>(null)
  const [files, setFiles] = useState<
    Array<{
      id: string
      filename: string
      chunks: number
      createdAt: string
    }>
  >([])

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await window.api.file.getAll()
        if (response.success) {
          setFiles(response.data)
        }
      } catch (error) {
        console.error('Failed to load files:', error)
      }
    }
    loadFiles()
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
      const chat = chats.find((c) => c.id === chatId)

      if (response.success && response.data) {
        updateTabState(tabId, {
          messages: response.data,
          currentChatId: chatId,
          isLoading: false,
          currentModel: chat?.model || 'llama2'
        })

        // Also update the model in the Ollama service
        await window.api.setModel(chat?.model || 'llama2')
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

  const sendMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    const currentState = getTabState(tabId)
    const userMessage = { role: 'user' as const, content, type }

    updateTabState(tabId, {
      messages: [...currentState.messages, userMessage],
      isLoading: true
    })

    try {
      const response = await window.api.chat({
        chatId: currentState.currentChatId,
        messages: [...currentState.messages, userMessage],
        useInternetSearch: isInternetSearchEnabled
      })

      if (response.success && response.data) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: response.data.content,
          type: 'text' as const,
          sources: response.data.sources
        }

        updateTabState(tabId, {
          messages: [...currentState.messages, userMessage, assistantMessage],
          currentChatId: response.data.chatId,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      updateTabState(tabId, { isLoading: false })
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
    }
  }

  const handleImageGeneration = async () => {
    if (!input.trim()) return

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

    // Clear input immediately after sending
    setInput('')

    await sendMessage(content, 'text')
  }

  const handleChatSelect = async (chat: Chat) => {
    const tabStore = useTabStore.getState()
    const existingTab = tabStore.tabs.find(
      (tab) => tab.type === 'chat' && tab.state?.currentChatId === chat.id
    )

    if (existingTab) {
      tabStore.setActiveTab(existingTab.id)
    } else {
      // First get the chat messages
      const response = await window.api.getChatMessages(chat.id)

      // Generate new tab ID
      const newTabId = uuidv4()

      // Create new tab with proper initial state
      tabStore.createTab('chat', chat.title, newTabId, {
        messages: response.success ? response.data : [],
        currentChatId: chat.id,
        currentModel: chat.model,
        isLoading: false,
        isSidebarOpen: true
      })

      tabStore.setActiveTab(newTabId)

      // Update the model in the Ollama service
      await window.api.setModel(chat.model)
    }
  }

  const handleFileUpload = async (filePath: string) => {
    try {
      const response = await window.api.file.process(filePath)
      if (response.success) {
        setFiles((prev) => [...prev, response.data])
      }
    } catch (error) {
      console.error('Failed to process file:', error)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await window.api.file.delete(fileId)
      if (response.success) {
        setFiles((prev) => prev.filter((file) => file.id !== fileId))
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  return (
    <div className="flex h-full bg-white dark:bg-dark-400">
      {/* Chat History Sidebar */}
      <div
        className={`${
          tabState.isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-50 dark:bg-dark-50 transition-all duration-300 overflow-hidden flex flex-col h-full border-r border-gray-200 dark:border-dark-100`}
      >
        <div className="flex-none p-4">
          <button
            onClick={createNewChat}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-4 space-y-2">
            {chats?.map((chat) => (
              <div
                key={chat.id}
                className={`group flex flex-col space-y-1 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                  tabState?.currentChatId === chat.id ? 'bg-gray-100 dark:bg-gray-700' : ''
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
                      className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 p-1 rounded w-full outline-none border border-gray-200 dark:border-gray-600"
                      autoFocus
                    />
                  ) : (
                    <div className="truncate text-sm text-gray-900 dark:text-gray-200">
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
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-400"
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
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-dark-100 mt-4">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Files</h3>
              <div className="space-y-4">
                <FileUploader onUpload={handleFileUpload} />
                <FileList files={files} onDelete={handleFileDelete} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-dark-400">
        <div className="flex-none border-b border-gray-200 dark:border-dark-100 p-4 flex items-center justify-between bg-white dark:bg-dark-50">
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
            <div className="flex items-center space-x-4">
              <ModelSelector
                onModelSelect={handleModelSelect}
                currentModel={tabState.currentModel}
              />
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isInternetSearchEnabled}
                  onCheckedChange={toggleInternetSearch}
                  aria-label="Toggle internet search"
                />
                <span className="text-sm text-gray-400">Internet Search</span>
              </div>
            </div>
          </div>
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
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-dark-50'
                }`}
              >
                <MessageContent
                  content={message.content}
                  type={message.type}
                  isUser={message.role === 'user'}
                  sources={message.role === 'assistant' ? message.sources : undefined}
                />
              </div>
            </div>
          ))}
          {tabState.isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-50 dark:bg-dark-50">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="flex-none border-t border-gray-200 dark:border-dark-100 bg-white dark:bg-dark-50">
          <div className="flex flex-col">
            {selectedSystemPrompt && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 mx-4 mt-4">
                <span className="text-sm text-gray-600">
                  Using prompt: {selectedSystemPrompt.name}
                </span>
                <button
                  onClick={() => setSelectedSystemPrompt(null)}
                  className="text-gray-400 hover:text-gray-600"
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

            {/* Add FileList above the input */}
            {files.length > 0 && (
              <div className="mx-4 mt-4">
                <FileList files={files} onDelete={handleFileDelete} compact />
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1 flex items-end">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-dark-100 text-gray-900 dark:text-gray-100 rounded-lg pl-4 pr-20 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-dark-100"
                      placeholder="Type something..."
                      disabled={tabState.isLoading}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                      <FileUploader onUpload={handleFileUpload} />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    tabState.isLoading
                      ? 'bg-gray-100 dark:bg-dark-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={tabState.isLoading}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
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
