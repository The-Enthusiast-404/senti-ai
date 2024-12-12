import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      models: {
        list: () => Promise<{ models: OllamaModel[] }>
      }
    }
  }
}
