import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { DatabaseService } from './database'
import { v4 as uuidv4 } from 'uuid'
import { DocumentProcessor } from './documentProcessor'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { formatDocumentsAsString } from 'langchain/util/document'
import { ProcessedDocument } from './documentProcessor'
import { WebSearchService } from './webSearch'
import { SystemPrompt } from './database'

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

  constructor() {
    this.models = new Map()
    this.db = new DatabaseService()
  }

  private getModel(modelName: string): ChatOllama {
    if (!this.models.has(modelName)) {
      this.models.set(
        modelName,
        new ChatOllama({
          baseUrl: 'http://localhost:11434',
          model: modelName
        })
      )
    }
    return this.models.get(modelName)!
  }

  async getAvailableModels(): Promise<string[]> {
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    return data.models.map((model: { name: string }) => model.name)
  }

  async chat(chatId: string | null, messages: Message[], modelName: string) {
    const model = this.getModel(modelName)
    const systemMessage = messages.find((m) => m.role === 'system')
    const userMessages = messages.filter((m) => m.role !== 'system')

    let newChatId = chatId
    if (!newChatId) {
      newChatId = uuidv4()
      await this.db.createChat({
        id: newChatId,
        title: userMessages[userMessages.length - 1].content.slice(0, 50) + '...',
        model: model.model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    const prompt = systemMessage
      ? `${systemMessage.content}\n\nUser: ${userMessages[userMessages.length - 1].content}`
      : userMessages[userMessages.length - 1].content

    const chain = RunnableSequence.from([model, new StringOutputParser()])
    const response = await chain.invoke(prompt)

    // Save messages to database
    await this.db.addMessage({
      id: uuidv4(),
      chatId: newChatId,
      role: 'user',
      content: userMessages[userMessages.length - 1].content,
      type: 'text',
      createdAt: new Date().toISOString()
    })

    await this.db.addMessage({
      id: uuidv4(),
      chatId: newChatId,
      role: 'assistant',
      content: response,
      type: 'text',
      createdAt: new Date().toISOString()
    })

    return {
      chatId: newChatId,
      content: response
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

  async processFile(filePath: string): Promise<ProcessedDocument> {
    return await this.documentProcessor.processFile(filePath)
  }

  async chatWithRAG(chatId: string | null, messages: Message[], modelName: string) {
    const model = this.getModel(modelName)
    const lastMessage = messages[messages.length - 1]
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

    const context = formatDocumentsAsString(relevantDocs)
    const prompt = `Context: ${context}\n\nQuestion: ${lastMessage.content}\n\nAnswer: `

    const chain = RunnableSequence.from([model, new StringOutputParser()])
    const response = await chain.invoke(prompt)

    // Save message to database
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
      content: response,
      type: 'text',
      createdAt: new Date().toISOString()
    })

    return {
      chatId: newChatId,
      content: response
    }
  }

  async removeProcessedFile(fileId: string): Promise<void> {
    await this.documentProcessor.deleteDocument(fileId)
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
}
