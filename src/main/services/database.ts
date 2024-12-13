import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

export interface ChatMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
}

export class DatabaseService {
  private db: Database.Database

  constructor() {
    const dbPath = join(app.getPath('userData'), 'chat.db')
    this.db = new Database(dbPath)
    this.initialize()
  }

  private initialize(): void {
    // Create chats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        model TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    // Create messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
      )
    `)
  }

  createChat(chat: Chat): void {
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, title, model, createdAt, updatedAt)
      VALUES (@id, @title, @model, @createdAt, @updatedAt)
    `)
    stmt.run(chat)
  }

  updateChat(chat: Chat): void {
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET title = @title, model = @model, updatedAt = @updatedAt
      WHERE id = @id
    `)
    stmt.run(chat)
  }

  deleteChat(chatId: string): void {
    const stmt = this.db.prepare('DELETE FROM chats WHERE id = ?')
    stmt.run(chatId)
  }

  getChat(chatId: string): Chat | undefined {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE id = ?')
    return stmt.get(chatId) as Chat | undefined
  }

  getAllChats(): Chat[] {
    const stmt = this.db.prepare('SELECT * FROM chats ORDER BY updatedAt DESC')
    return stmt.all() as Chat[]
  }

  addMessage(message: ChatMessage): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, chatId, role, content, createdAt)
      VALUES (@id, @chatId, @role, @content, @createdAt)
    `)
    stmt.run(message)
  }

  getChatMessages(chatId: string): ChatMessage[] {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt ASC')
    return stmt.all(chatId) as ChatMessage[]
  }

  // Transaction example for creating a chat with messages
  createChatWithMessages(chat: Chat, messages: ChatMessage[]): void {
    const transaction = this.db.transaction((chat: Chat, messages: ChatMessage[]) => {
      this.createChat(chat)
      for (const message of messages) {
        this.addMessage(message)
      }
    })

    transaction(chat, messages)
  }
}
