import { Embeddings } from '@langchain/core/embeddings'

export class OllamaEmbeddings extends Embeddings {
  private model: string
  private baseUrl: string

  constructor(config: { baseUrl?: string; model?: string } = {}) {
    super()
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434'
    this.model = config.model ?? 'nomic-embed-text'
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(texts.map((text) => this.embedQuery(text)))
    return embeddings
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      // Dynamic import of node-fetch
      const { default: fetch } = await import('node-fetch')

      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('Error getting embeddings from Ollama:', error)
      throw error
    }
  }
}
