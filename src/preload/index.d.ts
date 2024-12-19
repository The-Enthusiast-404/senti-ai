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
        useInternetSearch: boolean
      }) => Promise<{
        success: boolean
        data?: {
          chatId: string
          content: string
          sources?: Array<{
            title: string
            url: string
            domain: string
          }>
        }
        error?: string
      }>
      setModel: (modelName: string) => Promise<{
        success: boolean
        error?: string
      }>
      getModels: () => Promise<{
        success: boolean
        data?: string[]
        error?: string
      }>
      generateImage: (prompt: string) => Promise<{
        success: boolean
        data?: string
        error?: string
      }>
      updateChatTitle: (
        chatId: string,
        newTitle: string
      ) => Promise<{
        success: boolean
        error?: string
      }>
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
        data?: any
        error?: string
      }>
      file: {
        getAll: () => Promise<{
          success: boolean
          data?: Array<{
            id: string
            filename: string
            chunks: number
            createdAt: string
          }>
          error?: string
        }>
        process: (filePath: string) => Promise<...>
        delete: (documentId: string) => Promise<...>
      }
    }
  }
}
