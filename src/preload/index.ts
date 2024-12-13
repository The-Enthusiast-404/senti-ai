import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  chat: (params: {
    chatId: string | null
    messages: { role: 'user' | 'assistant'; content: string }[]
  }) => ipcRenderer.invoke('ollama:chat', params),
  setModel: (modelName: string) => ipcRenderer.invoke('ollama:setModel', modelName),
  getModels: () => ipcRenderer.invoke('ollama:getModels'),
  getChats: () => ipcRenderer.invoke('chat:getAll'),
  getChatMessages: (chatId: string) => ipcRenderer.invoke('chat:getMessages', chatId),
  deleteChat: (chatId: string) => ipcRenderer.invoke('chat:delete', chatId),
  updateChatTitle: (chatId: string, newTitle: string) =>
    ipcRenderer.invoke('chat:updateTitle', chatId, newTitle),
  generateImage: (prompt: string) => ipcRenderer.invoke('image:generate', prompt)
}

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
