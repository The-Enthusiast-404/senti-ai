import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { DatabaseService } from './database'
import { v4 as uuidv4 } from 'uuid'

export class OllamaService {
  private model: ChatOllama
  private db: DatabaseService

  constructor(modelName: string = 'llama2') {
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: modelName
    })
    this.db = new DatabaseService()
  }

  async getAvailableModels(): Promise<string[]> {
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    return data.models.map((model: { name: string }) => model.name)
  }

  async chat(chatId: string | null, messages: { role: 'user' | 'assistant'; content: string }[]) {
    const formattedMessages: BaseMessage[] = messages.map((msg) =>
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    )

    const response = await this.model.call(formattedMessages)

    // If no chatId provided, create a new chat
    if (!chatId) {
      chatId = uuidv4()
      const chat = {
        id: chatId,
        title: messages[0].content.slice(0, 50) + '...',
        model: this.model.model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.db.createChat(chat)
    } else {
      // Update existing chat
      const chat = this.db.getChat(chatId)
      if (chat) {
        this.db.updateChat({
          ...chat,
          updatedAt: new Date().toISOString()
        })
      }
    }

    // Save the user's message
    const userMessage = {
      id: uuidv4(),
      chatId,
      role: 'user' as const,
      content: messages[messages.length - 1].content,
      createdAt: new Date().toISOString()
    }
    this.db.addMessage(userMessage)

    // Save the assistant's message
    const assistantMessage = {
      id: uuidv4(),
      chatId,
      role: 'assistant' as const,
      content: String(response.content),
      createdAt: new Date().toISOString()
    }
    this.db.addMessage(assistantMessage)

    return {
      chatId,
      content: response.content
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
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: modelName
    })
  }
}
