import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { DatabaseService } from './database'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'image'
}

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

  async chat(chatId: string | null, messages: Message[]) {
    const formattedMessages: BaseMessage[] = messages.map((msg) => {
      if (msg.role === 'user') {
        if (msg.type === 'image') {
          return new HumanMessage({
            content: [
              {
                type: 'image_url',
                image_url: msg.content
              }
            ]
          })
        }
        return new HumanMessage(msg.content)
      }
      return new AIMessage(msg.content)
    })

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
      type: messages[messages.length - 1].type || 'text',
      createdAt: new Date().toISOString()
    }
    this.db.addMessage(userMessage)

    // Save the assistant's message
    const assistantMessage = {
      id: uuidv4(),
      chatId,
      role: 'assistant' as const,
      content: String(response.content),
      type: 'text' as const,
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
}
