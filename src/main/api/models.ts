import { ipcMain } from 'electron'

export function setupModelHandlers(): void {
  ipcMain.handle('models:list', async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags')
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch models:', error)
      throw error
    }
  })
}
