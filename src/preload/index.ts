import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  chat: (params: {
    chatId: string | null
    messages: { role: 'user' | 'assistant'; content: string }[]
    useInternetSearch: boolean
  }) => ipcRenderer.invoke('ollama:chat', params),
  setModel: (modelName: string) => ipcRenderer.invoke('ollama:setModel', modelName),
  getModels: () => ipcRenderer.invoke('ollama:getModels'),
  getChats: () => ipcRenderer.invoke('chat:getAll'),
  getChatMessages: (chatId: string) => ipcRenderer.invoke('chat:getMessages', chatId),
  deleteChat: (chatId: string) => ipcRenderer.invoke('chat:delete', chatId),
  updateChatTitle: (chatId: string, newTitle: string) =>
    ipcRenderer.invoke('chat:updateTitle', chatId, newTitle),
  generateImage: (prompt: string) => ipcRenderer.invoke('image:generate', prompt),
  systemPrompt: {
    getAll: () => ipcRenderer.invoke('systemPrompt:getAll'),
    create: (prompt) => ipcRenderer.invoke('systemPrompt:create', prompt),
    update: (id, updates) => ipcRenderer.invoke('systemPrompt:update', id, updates),
    delete: (id) => ipcRenderer.invoke('systemPrompt:delete', id)
  },
  generateCode: (prompt: string) => ipcRenderer.invoke('code:generate', prompt),
  getStockData: (ticker: string) => ipcRenderer.invoke('stock:getData', ticker),
  file: {
    getAll: () => ipcRenderer.invoke('file:getAll'),
    process: (filePath: string) => ipcRenderer.invoke('file:process', filePath),
    delete: (documentId: string) => ipcRenderer.invoke('file:delete', documentId)
  },
  platform: process.platform,
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  }
}

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('electron', {
  ...electronAPI,
  shell: {
    openExternal: (url: string) => shell.openExternal(url)
  }
})
