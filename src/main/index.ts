import { app, shell, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { DocumentProcessor } from './services/DocumentProcessor'

const documentProcessor = new DocumentProcessor()

// Add this function to create PDF windows
function createPDFWindow(pdfPath: string): void {
  const pdfWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      plugins: true
    }
  })

  pdfWindow.loadURL(`file://${pdfPath}`)
}

// Add this IPC handler
ipcMain.handle('open-pdf', async (_, pdfPath) => {
  createPDFWindow(pdfPath)
})

// Add this new IPC handler to get available models
ipcMain.handle('get-ollama-models', async () => {
  try {
    const { default: fetch } = await import('node-fetch')
    const response = await fetch('http://localhost:11434/api/tags')
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }
    const data = await response.json()
    // Extract just the model names from the models array
    return data.models.map((model: { name: string }) => model.name)
  } catch (error) {
    console.error('Error fetching Ollama models:', error)
    return []
  }
})

// Update the existing chat handler to accept model parameter
ipcMain.handle(
  'chat-with-ollama',
  async (
    _,
    data: {
      message: string
      context: string
      pageNumber: number
      model: string
      isChapterAction: boolean
    }
  ) => {
    try {
      // Dynamic import of node-fetch
      const { default: fetch } = await import('node-fetch')

      // Process the page content if not already processed
      await documentProcessor.processPage(data.pageNumber, data.context)

      // Get relevant context for the query
      const relevantContext = await documentProcessor.getRelevantContext(
        data.pageNumber,
        data.message
      )

      const prompt = data.isChapterAction
        ? `You are a helpful AI assistant analyzing a book chapter. You are currently looking at chapter content. Here is the relevant context from the chapter:\n\n${relevantContext}\n\nUser question: ${data.message}`
        : `You are a helpful AI assistant analyzing a PDF document. You are currently looking at page ${data.pageNumber}. Here is the relevant context from the document:\n\n${relevantContext}\n\nUser question: ${data.message}`

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: data.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const responseData = await response.json()
      return responseData.message.content
    } catch (error) {
      console.error('Error calling Ollama API:', error)
      throw error
    }
  }
)

// Add a handler to clear document processor when closing PDF
ipcMain.handle('clear-document-context', async () => {
  documentProcessor.clear()
})

// Add new IPC handlers for chapter management
ipcMain.handle(
  'process-chapter',
  async (_, data: { title: string; startPage: number; endPage: number }) => {
    try {
      await documentProcessor.processChapter(data.title, data.startPage, data.endPage)
      return true
    } catch (error) {
      console.error('Error processing chapter:', error)
      throw error
    }
  }
)

ipcMain.handle('get-chapter-info', async (_, pageNumber: number) => {
  try {
    const chapterInfo = documentProcessor.getChapterForPage(pageNumber)
    return chapterInfo
  } catch (error) {
    console.error('Error getting chapter info:', error)
    throw error
  }
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true
    }
  })

  // Register custom protocol
  protocol.registerFileProtocol('pagepal-pdf', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('pagepal-pdf://', ''))
    try {
      callback({ path: filePath })
    } catch (error) {
      console.error('Protocol error:', error)
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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('select-pdf', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    return result
  })

  ipcMain.handle('read-pdf', async (_, path) => {
    try {
      const buffer = await fs.promises.readFile(path)
      return buffer
    } catch (error) {
      console.error('Error reading PDF:', error)
      throw error
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Register protocol
  protocol.registerFileProtocol('pagepal-pdf', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('pagepal-pdf://', ''))
    try {
      callback({ path: filePath })
    } catch (error) {
      console.error('Protocol error:', error)
    }
  })

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
