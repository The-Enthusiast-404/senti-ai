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

interface Message {
  role: 'user' | 'assistant'
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
  private model: ChatOllama
  private db: DatabaseService
  private documentProcessor: DocumentProcessor
  private webSearch: WebSearchService

  constructor(modelName: string = 'llama2') {
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: modelName
    })
    this.db = new DatabaseService()
    this.documentProcessor = new DocumentProcessor()

    const braveApiKey = process.env.BRAVE_API_KEY
    if (!braveApiKey) {
      console.warn('BRAVE_API_KEY not found in environment variables')
    }
    this.webSearch = new WebSearchService(braveApiKey || '')
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

  async chatWithRAG(chatId: string | null, messages: Message[]) {
    const lastMessage = messages[messages.length - 1]
    const relevantDocs = await this.documentProcessor.queryDocuments(lastMessage.content)

    let newChatId = chatId
    if (!newChatId) {
      newChatId = uuidv4()
      await this.db.createChat({
        id: newChatId,
        title: lastMessage.content.slice(0, 50) + '...',
        model: this.model.model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    const context = formatDocumentsAsString(relevantDocs)
    const prompt = `Context: ${context}\n\nQuestion: ${lastMessage.content}\n\nAnswer: `

    const chain = RunnableSequence.from([this.model, new StringOutputParser()])
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

  async chatWithWebRAG(chatId: string | null, messages: Message[]) {
    const lastMessage = messages[messages.length - 1]

    // Get relevant web search results
    const webResults = await this.webSearch.search(lastMessage.content)

    let newChatId = chatId
    if (!newChatId) {
      newChatId = uuidv4()
      await this.db.createChat({
        id: newChatId,
        title: lastMessage.content.slice(0, 50) + '...',
        model: this.model.model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    const context = formatDocumentsAsString(webResults)
    const prompt = `Context from web search:\n${context}\n\nQuestion: ${lastMessage.content}\n\nProvide a comprehensive answer based on the search results. Include relevant URLs as citations in your response.`

    const chain = RunnableSequence.from([this.model, new StringOutputParser()])
    const response = await chain.invoke(prompt)

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
}
