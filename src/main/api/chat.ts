import { ipcMain } from 'electron'

export function setupChatHandlers(): void {
  ipcMain.handle('chat:completion', async (_event, { messages, model }) => {
    try {
      console.log('Request:', { model, messages })

      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Response from Ollama:', data)

      if (!data.message) {
        throw new Error('No message in response')
      }

      return data.message.content
    } catch (error) {
      console.error('Chat completion error:', error)
      throw error
    }
  })
}
