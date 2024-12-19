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

// Add a cache for storing timeframe data
const stockDataCache = new Map<string, Map<string, any>>()

async function fetchStockData(ticker: string, timeframe: string) {
  // Check if we have cached data for this ticker
  if (!stockDataCache.has(ticker)) {
    stockDataCache.set(ticker, new Map())
  }

  const tickerCache = stockDataCache.get(ticker)!

  // Always fetch the latest price first
  const latestPriceData = await fetchTimeframeData(ticker, '1D')
  const latestPrice = latestPriceData.results?.[latestPriceData.results.length - 1]

  // If we don't have ALL timeframe data, fetch it first
  if (!tickerCache.has('ALL')) {
    const allTimeData = await fetchTimeframeData(ticker, 'ALL')
    tickerCache.set('ALL', {
      ...allTimeData,
      latestPrice
    })

    // Derive other timeframes from ALL data
    const now = new Date()
    const allResults = allTimeData.results || []

    // Store derived data for each timeframe
    const timeframes = ['5D', '1M', '6M', '1Y']
    timeframes.forEach((tf) => {
      let startDate = new Date()
      switch (tf) {
        case '5D':
          startDate.setDate(now.getDate() - 5)
          break
        case '1M':
          startDate.setMonth(now.getMonth() - 1)
          break
        case '6M':
          startDate.setMonth(now.getMonth() - 6)
          break
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      const filteredResults = allResults.filter(
        (result) => new Date(result.t) >= startDate && new Date(result.t) <= now
      )

      tickerCache.set(tf, {
        ...allTimeData,
        results: filteredResults,
        latestPrice
      })
    })
  }

  const timeframeData = tickerCache.get(timeframe) || tickerCache.get('ALL')
  return {
    ...timeframeData,
    latestPrice: latestPrice || timeframeData.results[timeframeData.results.length - 1]
  }
}

async function fetchTimeframeData(ticker: string, timeframe: string) {
  const now = new Date()
  let startDate = new Date()
  let interval = '1/day'

  switch (timeframe) {
    case 'ALL':
      startDate.setFullYear(now.getFullYear() - 5)
      interval = '1/day'
      break
    case '5D':
      startDate.setDate(now.getDate() - 5)
      interval = '15/minute'
      break
    case '1M':
      startDate.setMonth(now.getMonth() - 1)
      interval = '1/day'
      break
    case '6M':
      startDate.setMonth(now.getMonth() - 6)
      interval = '1/day'
      break
    case '1Y':
      startDate.setFullYear(now.getFullYear() - 1)
      interval = '1/day'
      break
    default:
      startDate.setMonth(now.getMonth() - 1)
  }

  try {
    const response = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${interval}/${startDate.toISOString().split('T')[0]}/${now.toISOString().split('T')[0]}?adjusted=true&sort=asc&apiKey=${process.env.POLYGON_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(data.error || 'API returned an error')
    }

    return {
      ok: true,
      results: data.results || [],
      status: 'SUCCESS'
    }
  } catch (error) {
    console.error('Fetch error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stock data',
      results: []
    }
  }
}

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

  ipcMain.handle('code:generate', async (_, prompt: string) => {
    try {
      const result = await codeGenerationService.generateComponent(prompt)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred'
      return { success: false, error }
    }
  })

  ipcMain.handle('stock:getData', async (_, { ticker, timeframe = '1M' }) => {
    try {
      console.log('Fetching stock data for:', ticker, 'timeframe:', timeframe)
      const stockData = await fetchStockData(ticker, timeframe)

      if (!stockData.ok) {
        throw new Error(stockData.error || 'Failed to fetch stock data')
      }

      if (!stockData.results || stockData.results.length === 0) {
        throw new Error('No data available for this ticker')
      }

      const latestResult = stockData.latestPrice || stockData.results[stockData.results.length - 1]
      const previousResult = stockData.results[stockData.results.length - 1]

      // Fetch company details from Polygon API for accurate market cap
      const companyResponse = await fetch(
        `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${process.env.POLYGON_API_KEY}`
      )
      const companyData = await companyResponse.json()

      // Calculate market cap using shares outstanding from company data
      const marketCap = companyData.results?.market_cap || 0

      // Format chart data
      const chartData = stockData.results.map((result) => ({
        date: new Date(result.t).toLocaleDateString(),
        price: result.c
      }))

      const stockInfo = {
        ticker: ticker,
        price: latestResult.c,
        highPrice: latestResult.h,
        lowPrice: latestResult.l,
        previousClose: previousResult.c,
        percentChange: ((latestResult.c - stockData.results[0].c) / stockData.results[0].c) * 100,
        volume: latestResult.v,
        lastUpdated: new Date(latestResult.t).toLocaleString(),
        marketCap: marketCap,
        dayRange: `$${latestResult.l.toFixed(2)} - $${latestResult.h.toFixed(2)}`,
        yearRange: '0 - 0',
        avgVolume: Math.round(
          stockData.results.reduce((sum, r) => sum + r.v, 0) / stockData.results.length
        ),
        peRatio: 0,
        dividend: 0,
        chartData,
        aiSummary: {
          currentStatus: `${ticker} shares are currently trading at $${latestResult.c.toFixed(2)}, ${
            latestResult.c > previousResult.c ? 'up' : 'down'
          } ${Math.abs(((latestResult.c - previousResult.c) / previousResult.c) * 100).toFixed(2)}% from the previous close.`,
          recentPerformance: `The stock has shown notable fluctuations throughout the trading period, with a low of $${latestResult.l.toFixed(
            2
          )} and a high of $${latestResult.h.toFixed(2)}.`,
          marketContext: `With a market capitalization of $${(marketCap / 1e9).toFixed(2)} billion, ${ticker} ${
            marketCap > 200e9
              ? 'maintains its position as one of the significant players in the market'
              : 'continues to show presence in the market'
          }.`,
          keyMetrics: [
            { label: 'Current Price', value: `$${latestResult.c.toFixed(2)}` },
            {
              label: "Day's Range",
              value: `$${latestResult.l.toFixed(2)} - $${latestResult.h.toFixed(2)}`
            },
            { label: 'Market Cap', value: `$${(marketCap / 1e9).toFixed(2)}B` },
            { label: 'Volume', value: latestResult.v.toLocaleString() }
          ]
        }
      }

      return { success: true, data: stockInfo }
    } catch (err) {
      console.error('Stock API Error:', err)
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
