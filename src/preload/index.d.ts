import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      chat: (params: {
        chatId: string | null
        messages: { role: 'user' | 'assistant'; content: string; type: 'text' | 'image' }[]
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
          role: 'user' | 'assistant'
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
    }
  }
}
