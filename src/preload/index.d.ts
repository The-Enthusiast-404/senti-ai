import { ElectronAPI } from '@electron-toolkit/preload'
import { OllamaModel } from '../renderer/src/types/ollama'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      chat: {
        completion: (params: { messages: any[]; model: string }) => Promise<string>
        onStream: (callback: (content: string) => void) => void
        offStream: () => void
      }
      models: {
        list: () => Promise<{ models: OllamaModel[] }>
      }
    }
  }
}
