import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { DatabaseService } from './database'
import { DocumentProcessor } from './documentProcessor'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  type: 'text' | 'image'
}

interface ImageGenerationResponse {
  created: number
  data: Array<{
    b64_json: string
  }>
}

export class OllamaService {
  private models: Map<string, ChatOllama>
  private db: DatabaseService
  private documentProcessor: DocumentProcessor

  constructor() {
    this.models = new Map()
    this.db = new DatabaseService()
    this.documentProcessor = new DocumentProcessor()
  }

  private getModel(modelName: string, useContext: boolean = false): ChatOllama {
    const modelKey = `${modelName}-${useContext}`
    if (!this.models.has(modelKey)) {
      this.models.set(
        modelKey,
        new ChatOllama({
          baseUrl: 'http://localhost:11434',
          model: modelName,
          context: useContext
        })
      )
    }
    return this.models.get(modelKey)!
  }

  async getAvailableModels(): Promise<string[]> {
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    return data.models.map((model: { name: string }) => model.name)
  }

  async chat(chatId: string | null, messages: Message[], modelName: string) {
    const model = this.getModel(modelName, true)
    const lastMessage = messages[messages.length - 1]

    // Get relevant documents for the last message
    const relevantDocs = await this.documentProcessor.queryDocuments(lastMessage.content)

    let newChatId = chatId
    if (!newChatId) {
      newChatId = uuidv4()
      await this.db.createChat({
        id: newChatId,
        title: lastMessage.content.slice(0, 50) + '...',
        model: model.model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    // Prepare context from relevant documents
    let contextString = ''
    if (relevantDocs.length > 0) {
      contextString = `Relevant context from uploaded files:\n${relevantDocs
        .map((doc) => `[${doc.metadata.filename}]: ${doc.pageContent.substring(0, 500)}...`)
        .join('\n\n')}\n\n`
    }

    // Convert messages to LangChain format with context
    const langChainMessages = [
      new SystemMessage(
        contextString
          ? `You have access to the following context. Use it when relevant to answer questions:\n${contextString}`
          : 'You are a helpful assistant.'
      ),
      ...messages.map((msg) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content)
        } else if (msg.role === 'assistant') {
          return new AIMessage(msg.content)
        } else {
          return new SystemMessage(msg.content)
        }
      })
    ]

    const response = await model.invoke(langChainMessages)

    // Save messages to database
    await this.db.addMessage({
      id: uuidv4(),
      chatId: newChatId,
      role: 'user',
      content: lastMessage.content,
      type: 'text',
      createdAt: new Date().toISOString()
    })

    await this.db.addMessage({
      id: uuidv4(),
      chatId: newChatId,
      role: 'assistant',
      content: String(response.content),
      type: 'text',
      createdAt: new Date().toISOString()
    })

    return {
      chatId: newChatId,
      content: String(response.content)
    }
  }

  async getChats() {
    return this.db.getAllChats()
  }

  async getChatMessages(chatId: string) {
    return this.db.getChatMessages(chatId)
  }

  async deleteChat(chatId: string) {
    return this.db.deleteChat(chatId)
  }

  setModel(modelName: string) {
    this.getModel(modelName)
  }

  async updateChatTitle(chatId: string, newTitle: string) {
    const chat = this.db.getChat(chatId)
    if (chat) {
      const updatedChat = {
        ...chat,
        title: newTitle,
        updatedAt: new Date().toISOString()
      }
      this.db.updateChat(updatedChat)
      return updatedChat
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sdxl',
        prompt: prompt,
        stream: false
      })
    })

    const data = await response.json()
    return data.data[0].b64_json
  }

  async getSystemPrompts(): Promise<SystemPrompt[]> {
    return this.db.getAllSystemPrompts()
  }

  async createSystemPrompt(
    prompt: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SystemPrompt> {
    const now = new Date().toISOString()
    const newPrompt: SystemPrompt = {
      ...prompt,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    this.db.createSystemPrompt(newPrompt)
    return newPrompt
  }

  async updateSystemPrompt(id: string, updates: Partial<SystemPrompt>): Promise<SystemPrompt> {
    const existing = this.db.getSystemPrompt(id)
    if (!existing) {
      throw new Error('System prompt not found')
    }

    const updated: SystemPrompt = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    }
    this.db.updateSystemPrompt(updated)
    return updated
  }

  async deleteSystemPrompt(id: string): Promise<void> {
    this.db.deleteSystemPrompt(id)
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ message: { content: string } }> {
    const response = await this.getModel('llama2').invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    return { message: { content: String(response.content) } }
  }

  async processFile(filePath: string) {
    return await this.documentProcessor.processFile(filePath)
  }
}
