import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { OllamaService } from './services/ollama'

const ollamaService = new OllamaService()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
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
  ipcMain.handle('ollama:chat', async (_, { chatId, messages }) => {
    try {
      const response = await ollamaService.chat(chatId, messages)
      return { success: true, data: response }
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
