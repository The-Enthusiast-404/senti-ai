import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      chat: (params: {
        chatId: string | null
        messages: {
          role: 'user' | 'assistant' | 'system'
          content: string
          type: 'text' | 'image'
        }[]
      }) => Promise<{
        success: boolean
        data?: {
          chatId: string
          content: string
        }
        error?: string
      }>
      setModel: (modelName: string) => Promise<{ success: boolean; error?: string }>
      getModels: () => Promise<{ success: boolean; data?: string[]; error?: string }>
      getChats: () => Promise<{
        success: boolean
        data?: {
          id: string
          title: string
          model: string
          createdAt: string
          updatedAt: string
        }[]
        error?: string
      }>
      getChatMessages: (chatId: string) => Promise<{
        success: boolean
        data?: {
          id: string
          chatId: string
          role: 'user' | 'assistant'
          content: string
          type: 'text' | 'image'
          createdAt: string
        }[]
        error?: string
      }>
      deleteChat: (chatId: string) => Promise<{ success: boolean; error?: string }>
      updateChatTitle: (
        chatId: string,
        newTitle: string
      ) => Promise<{
        success: boolean
        error?: string
      }>
      generateImage: (prompt: string) => Promise<{
        success: boolean
        data?: string
        error?: string
      }>
      processFile: (filePath: string) => Promise<{
        success: boolean
        data?: {
          id: string
          filename: string
          chunks: number
          createdAt: string
        }
        error?: string
      }>
      chatWithRAG: (params: {
        chatId: string | null
        messages: {
          role: 'user' | 'assistant' | 'system'
          content: string
          type: 'text' | 'image'
        }[]
      }) => Promise<{
        success: boolean
        data?: {
          chatId: string
          content: string
        }
        error?: string
      }>
      chatWithWebRAG: (params: {
        chatId: string | null
        messages: {
          role: 'user' | 'assistant' | 'system'
          content: string
          type: 'text' | 'image'
        }[]
      }) => Promise<{
        success: boolean
        data?: {
          chatId: string
          content: string
        }
        error?: string
      }>
      removeProcessedFile: (fileId: string) => Promise<{ success: boolean; error?: string }>
      systemPrompt: {
        getAll: () => Promise<{
          success: boolean
          data?: SystemPrompt[]
          error?: string
        }>
        create: (prompt: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{
          success: boolean
          data?: SystemPrompt
          error?: string
        }>
        update: (
          id: string,
          updates: Partial<SystemPrompt>
        ) => Promise<{
          success: boolean
          data?: SystemPrompt
          error?: string
        }>
        delete: (id: string) => Promise<{
          success: boolean
          error?: string
        }>
      }
      generateCode: (prompt: string) => Promise<{
        success: boolean
        data?: {
          code: string
          language: string
          componentName: string
        }
        error?: string
      }>
      getStockData: (ticker: string) => Promise<{
        success: boolean
        data?: {
          ticker: string
          price: number
          highPrice: number
          lowPrice: number
          previousClose: number
          percentChange: number
          volume: number
          lastUpdated: string
        }
        error?: string
      }>
    }
  }
}
