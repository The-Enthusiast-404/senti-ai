import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

export interface Conversation {
  id: string
  title: string
  model: string
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export class ConversationsDB {
  constructor(private db: Database.Database) {}

  createConversation(title: string, model: string): Conversation {
    const now = Date.now()
    const conversation: Conversation = {
      id: uuidv4(),
      title,
      model,
      createdAt: now,
      updatedAt: now
    }

    this.db
      .prepare(
        `INSERT INTO conversations (id, title, model, created_at, updated_at)
         VALUES (@id, @title, @model, @createdAt, @updatedAt)`
      )
      .run(conversation)

    return conversation
  }

  getConversation(id: string): Conversation | undefined {
    return this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as
      | Conversation
      | undefined
  }

  listConversations(): Conversation[] {
    return this.db
      .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
      .all() as Conversation[]
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Message {
    const message: Message = {
      id: uuidv4(),
      conversationId,
      role,
      content,
      createdAt: Date.now()
    }

    this.db
      .prepare(
        `INSERT INTO messages (id, conversation_id, role, content, created_at)
         VALUES (@id, @conversationId, @role, @content, @createdAt)`
      )
      .run(message)

    // Update conversation's updated_at timestamp
    this.db
      .prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
      .run(Date.now(), conversationId)

    return message
  }

  getMessages(conversationId: string): Message[] {
    return this.db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as Message[]
  }

  deleteConversation(id: string): void {
    this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
  }
}
