import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke(channel: 'select-pdf'): Promise<{ canceled: boolean; filePaths: string[] }>
        invoke(channel: 'get-ollama-models'): Promise<string[]>
        invoke(
          channel: 'chat-with-ollama',
          data: {
            message: string
            context: string
            pageNumber: number
            model: string
          }
        ): Promise<string>
      }
    }
    api: unknown
  }
}
