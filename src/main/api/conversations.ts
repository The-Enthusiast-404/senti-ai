import { ipcMain } from 'electron'
import { ConversationsDB } from '../database/conversations'

export function setupConversationHandlers(db: ConversationsDB): void {
  ipcMain.handle('conversations:create', async (_event, { title, model }) => {
    return db.createConversation(title, model)
  })

  ipcMain.handle('conversations:list', async () => {
    return db.listConversations()
  })

  ipcMain.handle('conversations:get', async (_event, id) => {
    return db.getConversation(id)
  })

  ipcMain.handle('conversations:delete', async (_event, id) => {
    return db.deleteConversation(id)
  })

  ipcMain.handle('conversations:messages', async (_event, conversationId) => {
    return db.getMessages(conversationId)
  })

  ipcMain.handle('conversations:addMessage', async (_event, { conversationId, role, content }) => {
    return db.addMessage(conversationId, role, content)
  })

  ipcMain.handle('conversations:updateTitle', async (_event, { id, title }) => {
    db.updateTitle(id, title)
  })
}
