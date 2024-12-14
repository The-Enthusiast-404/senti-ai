import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface ChatMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'image'
  createdAt: string
}

export interface Chat {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
}

export interface SystemPrompt {
  id: string
  name: string
  content: string
  description: string
  category: string
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

    // Create messages table with new type column
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
      )
    `)

    // Create system prompts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    // Initialize default prompts
    this.initializeDefaultPrompts()
  }

  private initializeDefaultPrompts(): void {
    const defaultPrompts: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Code Assistant',
        category: 'Development',
        description: 'Specialized in writing and explaining code',
        content:
          'You are an expert programming assistant. Focus on providing clean, well-documented code examples. Always explain your code and suggest best practices. If you notice potential issues or optimizations, point them out.'
      },
      {
        name: 'Technical Writer',
        category: 'Writing',
        description: 'Helps with technical documentation and explanations',
        content:
          'You are a technical writing expert. Focus on clarity, accuracy, and structure. Use simple language to explain complex concepts. Include examples where helpful. Format your responses with clear headings and bullet points when appropriate.'
      },
      {
        name: 'Math Tutor',
        category: 'Education',
        description: 'Helps with mathematical concepts and problem-solving',
        content:
          'You are a patient and thorough mathematics tutor. Break down complex problems into steps, explain your reasoning clearly, and provide additional examples when needed. Use LaTeX notation for mathematical expressions when appropriate.'
      },
      {
        name: 'Concise Mode',
        category: 'General',
        description: 'Provides brief, to-the-point responses',
        content:
          'Provide brief, concise responses. Be direct and get to the point quickly. Avoid unnecessary explanations unless specifically asked.'
      },
      {
        name: 'Socratic Teacher',
        category: 'Education',
        description: 'Teaches through questions and guided discovery',
        content:
          'Guide through questions rather than direct answers. Help users discover solutions themselves. Ask probing questions that lead to deeper understanding. When appropriate, break down complex topics into simpler components.'
      },
      {
        name: 'Code Generator',
        category: 'Development',
        description: 'Specialized in generating React TypeScript components with Tailwind CSS',
        content: `You are an expert React TypeScript component generator. Follow these rules strictly:
1. Generate modern, clean React TypeScript code with Tailwind CSS
2. Use functional components with proper TypeScript interfaces
3. Include detailed prop interfaces
4. Use modern React hooks and patterns
5. Follow React best practices and conventions
6. Implement responsive design with Tailwind CSS
7. Add JSDoc comments for components and interfaces
8. Ensure type safety throughout the code
9. Use semantic HTML elements
10. Keep components modular and reusable`
      }
    ]

    // Add each default prompt if it doesn't exist
    for (const prompt of defaultPrompts) {
      const exists = this.db
        .prepare('SELECT id FROM system_prompts WHERE name = ?')
        .get(prompt.name)
      if (!exists) {
        const now = new Date().toISOString()
        this.createSystemPrompt({
          ...prompt,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        })
      }
    }
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
      SET title = ?, model = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(chat.title, chat.model, chat.updatedAt, chat.id)
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

  updateChatTitle(chatId: string, newTitle: string): void {
    const stmt = this.db.prepare(`
      UPDATE chats 
      SET title = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(newTitle, new Date().toISOString(), chatId)
  }

  createSystemPrompt(prompt: SystemPrompt): void {
    const stmt = this.db.prepare(`
      INSERT INTO system_prompts (id, name, content, description, category, createdAt, updatedAt)
      VALUES (@id, @name, @content, @description, @category, @createdAt, @updatedAt)
    `)
    stmt.run(prompt)
  }

  updateSystemPrompt(prompt: SystemPrompt): void {
    const stmt = this.db.prepare(`
      UPDATE system_prompts 
      SET name = ?, content = ?, description = ?, category = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(
      prompt.name,
      prompt.content,
      prompt.description,
      prompt.category,
      prompt.updatedAt,
      prompt.id
    )
  }

  deleteSystemPrompt(id: string): void {
    const stmt = this.db.prepare('DELETE FROM system_prompts WHERE id = ?')
    stmt.run(id)
  }

  getSystemPrompt(id: string): SystemPrompt | undefined {
    const stmt = this.db.prepare('SELECT * FROM system_prompts WHERE id = ?')
    return stmt.get(id) as SystemPrompt | undefined
  }

  getAllSystemPrompts(): SystemPrompt[] {
    const stmt = this.db.prepare('SELECT * FROM system_prompts ORDER BY name ASC')
    return stmt.all() as SystemPrompt[]
  }
}
