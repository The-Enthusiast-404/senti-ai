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
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      let responseText = ''

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          const json = JSON.parse(line)
          if (json.message?.content) {
            responseText += json.message.content
            _event.sender.send('chat:stream', json.message.content)
          }
        }
      }

      return responseText
    } catch (error) {
      console.error('Chat completion error:', error)
      throw error
    }
  })
}
