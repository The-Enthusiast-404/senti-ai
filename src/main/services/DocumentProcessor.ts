import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OllamaEmbeddings } from './OllamaEmbeddings'

export class DocumentProcessor {
  private vectorStore: MemoryVectorStore | null = null
  private pageContexts: Map<number, string> = new Map()
  private embeddings: OllamaEmbeddings

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text' // or any other model you prefer
    })
  }

  async processPage(pageNumber: number, content: string): Promise<void> {
    // Store original page content
    this.pageContexts.set(pageNumber, content)

    // Split content into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    })

    const docs = await textSplitter.createDocuments([content], [{ pageNumber }])

    // Initialize vector store if not exists
    if (!this.vectorStore) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings)
    } else {
      await this.vectorStore.addDocuments(docs)
    }
  }

  async getRelevantContext(pageNumber: number, query: string): Promise<string> {
    if (!this.vectorStore) {
      return this.pageContexts.get(pageNumber) || ''
    }

    // Get relevant documents
    const relevantDocs = await this.vectorStore.similaritySearch(query, 3)

    // Filter docs from current page and nearby pages
    const filteredDocs = relevantDocs.filter(
      (doc) => Math.abs(doc.metadata.pageNumber - pageNumber) <= 1
    )

    // Combine contexts
    const combinedContext = filteredDocs.map((doc) => doc.pageContent).join('\n\n')

    return combinedContext || this.pageContexts.get(pageNumber) || ''
  }

  clear(): void {
    this.vectorStore = null
    this.pageContexts.clear()
  }
}
