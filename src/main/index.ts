import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { OllamaService } from './services/ollama'
import dotenv from 'dotenv'
import path from 'path'
import { CodeGenerationService } from './services/codeGeneration'

// Load environment variables from .env file
dotenv.config({
  path: path.join(process.cwd(), '.env')
})

// Validate required environment variables
if (!process.env.BRAVE_API_KEY || !process.env.POLYGON_API_KEY) {
  console.error('BRAVE_API_KEY and POLYGON_API_KEY are required in .env file')
}

const ollamaService = new OllamaService()
const codeGenerationService = new CodeGenerationService()

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

  ipcMain.handle('document:process', async (_, filePath) => {
    try {
      const result = await ollamaService.processFile(filePath)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('ollama:chatWithRAG', async (_, params) => {
    try {
      const result = await ollamaService.chatWithRAG(params.chatId, params.messages)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('ollama:chatWithWebRAG', async (_, params) => {
    try {
      const result = await ollamaService.chatWithWebRAG(params.chatId, params.messages)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('document:remove', async (_, fileId) => {
    try {
      await ollamaService.removeProcessedFile(fileId)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('systemPrompt:getAll', async () => {
    try {
      const prompts = await ollamaService.getSystemPrompts()
      return { success: true, data: prompts }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('systemPrompt:create', async (_, prompt) => {
    try {
      const newPrompt = await ollamaService.createSystemPrompt(prompt)
      return { success: true, data: newPrompt }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('systemPrompt:update', async (_, id, updates) => {
    try {
      const updated = await ollamaService.updateSystemPrompt(id, updates)
      return { success: true, data: updated }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('systemPrompt:delete', async (_, id) => {
    try {
      await ollamaService.deleteSystemPrompt(id)
      return { success: true }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('code:generate', async (_, prompt: string) => {
    try {
      const result = await codeGenerationService.generateComponent(prompt)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('stock:getData', async (_, ticker: string) => {
    try {
      console.log('Fetching stock data for:', ticker)
      // Get today's date and previous trading day
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const todayStr = today.toISOString().split('T')[0]
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${thirtyDaysAgoStr}/${todayStr}?adjusted=true&sort=desc&limit=30&apiKey=${process.env.POLYGON_API_KEY}`
      )
      const data = await response.json()
      console.log('API Response:', JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status} ${response.statusText}`)
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No data available for this ticker')
      }

      const latestResult = data.results[0]
      const previousResult = data.results[1] || latestResult

      const stockData = {
        ticker: ticker,
        price: latestResult.c,
        highPrice: latestResult.h,
        lowPrice: latestResult.l,
        previousClose: previousResult.c,
        percentChange: ((latestResult.c - previousResult.c) / previousResult.c) * 100,
        volume: latestResult.v,
        lastUpdated: new Date(latestResult.t).toLocaleString(),
        marketCap: 0,
        dayRange: `$${latestResult.l.toFixed(2)} - $${latestResult.h.toFixed(2)}`,
        yearRange: '0 - 0',
        avgVolume: Math.round(data.results.reduce((sum, r) => sum + r.v, 0) / data.results.length),
        peRatio: 0,
        dividend: 0
      }

      return { success: true, data: stockData }
    } catch (err) {
      console.error('Stock API Error:', err)
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
