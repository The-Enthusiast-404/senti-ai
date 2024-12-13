import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'

export class OllamaService {
  private model: ChatOllama

  constructor(modelName: string = 'llama2') {
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: modelName
    })
  }

  async getAvailableModels(): Promise<string[]> {
    const response = await fetch('http://localhost:11434/api/tags')
    const data = await response.json()
    return data.models.map((model: { name: string }) => model.name)
  }

  async chat(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const formattedMessages: BaseMessage[] = messages.map((msg) =>
      msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    )

    const response = await this.model.call(formattedMessages)
    return response.content
  }

  setModel(modelName: string) {
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: modelName
    })
  }
}
