import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { OllamaService } from './services/ollama'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({
  path: path.join(process.cwd(), '.env')
})

// Validate required environment variables
if (!process.env.BRAVE_API_KEY || !process.env.POLYGON_API_KEY) {
  console.error('BRAVE_API_KEY and POLYGON_API_KEY are required in .env file')
}

const ollamaService = new OllamaService()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Ollama IPC handlers
  ipcMain.handle('ollama:chat', async (_, params) => {
    try {
      const result = await ollamaService.chat(
        params.chatId,
        params.messages,
        params.useInternetSearch
      )
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('ollama:setModel', async (_, modelName) => {
    try {
      ollamaService.setModel(modelName)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('ollama:getModels', async () => {
    try {
      const models = await ollamaService.getAvailableModels()
      return { success: true, data: models }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  // New chat history handlers
  ipcMain.handle('chat:getAll', async () => {
    try {
      const chats = await ollamaService.getChats()
      return { success: true, data: chats }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('chat:getMessages', async (_, chatId) => {
    try {
      const messages = await ollamaService.getChatMessages(chatId)
      return { success: true, data: messages }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('chat:delete', async (_, chatId) => {
    try {
      await ollamaService.deleteChat(chatId)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('chat:updateTitle', async (_, chatId: string, newTitle: string) => {
    try {
      await ollamaService.updateChatTitle(chatId, newTitle)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('image:generate', async (_, prompt: string) => {
    try {
      const imageBase64 = await ollamaService.generateImage(prompt)
      return { success: true, data: imageBase64 }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('file:process', async (_, filePath: string) => {
    try {
      const result = await ollamaService.processFile(filePath)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('file:delete', async (_, documentId: string) => {
    try {
      await ollamaService.documentProcessor.deleteDocument(documentId)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('file:getAll', async () => {
    try {
      const files = await ollamaService.documentProcessor.getAllDocuments()
      return { success: true, data: files }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  // Add these IPC handlers
  ipcMain.on('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.on('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
