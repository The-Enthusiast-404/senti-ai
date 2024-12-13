import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      chat: (messages: { role: 'user' | 'assistant'; content: string }[]) => Promise<{
        success: boolean
        data?: string
        error?: string
      }>
      setModel: (modelName: string) => Promise<{ success: boolean; error?: string }>
      getModels: () => Promise<{ success: boolean; data?: string[]; error?: string }>
    }
  }
}
