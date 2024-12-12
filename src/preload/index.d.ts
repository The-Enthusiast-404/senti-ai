import { ElectronAPI } from '@electron-toolkit/preload'
import { OllamaModel } from '../renderer/src/types/ollama'
import { Conversation, Message } from '../main/database/conversations'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      chat: {
        completion: (params: { messages: any[]; model: string }) => Promise<string>
        onStream: (callback: (content: string) => void) => void
        offStream: () => void
        onStreamEnd?: (callback: () => void) => void
        offStreamEnd?: () => void
      }
      models: {
        list: () => Promise<{ models: OllamaModel[] }>
      }
      conversations: {
        create: (params: { title: string; model: string }) => Promise<Conversation>
        list: () => Promise<Conversation[]>
        get: (id: string) => Promise<Conversation>
        delete: (id: string) => Promise<void>
        messages: (conversationId: string) => Promise<Message[]>
        addMessage: (params: {
          conversationId: string
          role: 'user' | 'assistant'
          content: string
        }) => Promise<Message>
      }
    }
  }
}
