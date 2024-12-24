import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke(channel: 'select-pdf'): Promise<{ canceled: boolean; filePaths: string[] }>
      }
    }
    api: unknown
  }
}
