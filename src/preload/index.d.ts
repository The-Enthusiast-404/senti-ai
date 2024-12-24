import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke(channel: 'select-pdf'): Promise<{ canceled: boolean; filePaths: string[] }>
        invoke(channel: 'get-ollama-models'): Promise<string[]>
        invoke(channel: 'clear-document-context'): Promise<void>
        invoke(
          channel: 'chat-with-ollama',
          data: {
            message: string
            context: string
            pageNumber: number
            model: string
          }
        ): Promise<string>
        invoke(
          channel: 'process-chapter',
          data: { title: string; startPage: number; endPage: number }
        ): Promise<boolean>
        invoke(
          channel: 'get-chapter-info',
          pageNumber: number
        ): Promise<{
          title: string
          startPage: number
          endPage: number
          content: string
        } | null>
      }
    }
    api: unknown
  }
}
