import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  chat: {
    completion: (params: any) => ipcRenderer.invoke('chat:completion', params),
    onStream: (callback: (content: string) => void) => {
      ipcRenderer.on('chat:stream', (_event, content) => callback(content))
    },
    offStream: () => {
      ipcRenderer.removeAllListeners('chat:stream')
    },
    onStreamEnd: (callback: () => void) => {
      ipcRenderer.on('chat:stream-end', () => callback())
    },
    offStreamEnd: () => {
      ipcRenderer.removeAllListeners('chat:stream-end')
    }
  },
  models: {
    list: () => ipcRenderer.invoke('models:list')
  },
  conversations: {
    create: (params) => ipcRenderer.invoke('conversations:create', params),
    list: () => ipcRenderer.invoke('conversations:list'),
    get: (id) => ipcRenderer.invoke('conversations:get', id),
    delete: (id) => ipcRenderer.invoke('conversations:delete', id),
    messages: (conversationId) => ipcRenderer.invoke('conversations:messages', conversationId),
    addMessage: (params) => ipcRenderer.invoke('conversations:addMessage', params),
    updateTitle: (id: string, title: string) =>
      ipcRenderer.invoke('conversations:updateTitle', { id, title })
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
