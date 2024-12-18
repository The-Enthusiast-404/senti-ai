import { create } from 'zustand'
import { Chat, Message, SystemPrompt } from '../types'

interface ChatStore {
  // UI State
  chats: Chat[]
  currentChatId: string | null
  messages: Message[]
  isLoading: boolean
  currentModel: string
  isSidebarOpen: boolean
  files: Array<{
    id: string
    filename: string
    chunks: number
    createdAt: string
  }>

  // Actions (these will call the electron API endpoints)
  loadChats: () => Promise<void>
  loadChat: (chatId: string) => Promise<void>
  createNewChat: () => void
  deleteChat: (chatId: string) => Promise<void>
  updateChatTitle: (chatId: string, newTitle: string) => Promise<void>
  sendMessage: (content: string, type: 'text' | 'image') => Promise<void>
  setCurrentModel: (model: string) => Promise<void>
  toggleSidebar: () => void
  loadFiles: () => Promise<void>
  addFile: (file: any) => void
  removeFile: (id: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  isLoading: false,
  currentModel: 'llama2',
  isSidebarOpen: true,
  files: [],

  loadChats: async () => {
    try {
      const response = await window.api.getChats()
      if (response.success && response.data) {
        set({ chats: response.data })
      }
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  },

  loadChat: async (chatId) => {
    try {
      const response = await window.api.getChatMessages(chatId)
      if (response.success && response.data) {
        set({
          messages: response.data,
          currentChatId: chatId
        })

        // Set current model from chat data
        const { chats } = get()
        const chat = chats.find((c) => c.id === chatId)
        if (chat) {
          await window.api.setModel(chat.model)
          set({ currentModel: chat.model })
        }
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error)
    }
  },

  createNewChat: () => {
    set({
      messages: [],
      currentChatId: null
    })
  },

  deleteChat: async (chatId) => {
    try {
      const response = await window.api.deleteChat(chatId)
      if (response.success) {
        const { currentChatId } = get()
        if (currentChatId === chatId) {
          get().createNewChat()
        }
        await get().loadChats()
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  },

  updateChatTitle: async (chatId, newTitle) => {
    try {
      const response = await window.api.updateChatTitle(chatId, newTitle)
      if (response.success) {
        await get().loadChats()
      }
    } catch (error) {
      console.error('Failed to update chat title:', error)
    }
  },

  sendMessage: async (content, type = 'text') => {
    const { messages, currentChatId } = get()
    const userMessage = { role: 'user' as const, content, type }

    set({
      messages: [...messages, userMessage],
      isLoading: true
    })

    try {
      const response = await window.api.chat({
        chatId: currentChatId,
        messages: [...messages, userMessage]
      })

      if (response.success && response.data?.content && response.data?.chatId) {
        set((state) => ({
          messages: [
            ...state.messages,
            { role: 'assistant', content: response.data!.content, type: 'text' }
          ],
          currentChatId: response.data.chatId
        }))
        await get().loadChats()
      }
    } catch (error) {
      console.error('Chat error:', error)
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant',
            content: 'Sorry, there was an error processing your request.',
            type: 'text'
          }
        ]
      }))
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentModel: async (model) => {
    try {
      const response = await window.api.setModel(model)
      if (response.success) {
        set({ currentModel: model })
      }
    } catch (error) {
      console.error('Failed to switch model:', error)
    }
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  loadFiles: async () => {
    try {
      const response = await window.api.file.getAll()
      if (response.success) {
        set({ files: response.data })
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  },

  addFile: (file) => set((state) => ({ files: [...state.files, file] })),

  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) }))
}))
