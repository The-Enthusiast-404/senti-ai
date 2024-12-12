import { ipcMain } from 'electron'

export function setupChatHandlers(): void {
  ipcMain.handle('chat:completion', async (_event, messages) => {
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.1',
          messages: messages,
          stream: true
        })
      })

      return response
    } catch (error) {
      console.error('Chat completion error:', error)
      throw error
    }
  })
}
