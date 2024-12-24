import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OllamaEmbeddings } from './OllamaEmbeddings'

interface BookMetadata {
  title: string
  totalPages: number
  chapters: {
    title: string
    startPage: number
    endPage: number
  }[]
}

export class BookProcessor {
  private vectorStore: MemoryVectorStore | null = null
  private bookMetadata: BookMetadata | null = null
  private embeddings: OllamaEmbeddings

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text'
    })
  }

  async updateBookMetadata(metadata: BookMetadata): Promise<void> {
    this.bookMetadata = metadata

    // Create a comprehensive book overview for embedding
    const bookOverview = `
      Book: ${metadata.title}
      Total Pages: ${metadata.totalPages}
      
      Chapter Overview:
      ${metadata.chapters
        .map((chapter) => `- ${chapter.title} (Pages ${chapter.startPage}-${chapter.endPage})`)
        .join('\n')}
    `

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 400
    })

    const docs = await textSplitter.createDocuments(
      [bookOverview],
      [
        {
          title: metadata.title,
          isBook: true
        }
      ]
    )

    if (!this.vectorStore) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings)
    } else {
      await this.vectorStore.addDocuments(docs)
    }
  }

  async getBookContext(query: string): Promise<string> {
    if (!this.bookMetadata) return ''

    let contextResponse = `Book: ${this.bookMetadata.title}\n`
    contextResponse += `Total Pages: ${this.bookMetadata.totalPages}\n\n`
    contextResponse += 'Book Structure:\n'

    this.bookMetadata.chapters.forEach((chapter) => {
      contextResponse += `• ${chapter.title} (Pages ${chapter.startPage}-${chapter.endPage})\n`
    })

    if (this.vectorStore) {
      const relevantDocs = await this.vectorStore.similaritySearch(query, 3)
      if (relevantDocs.length > 0) {
        contextResponse += '\n\nRelevant Content:\n'
        relevantDocs.forEach((doc) => {
          contextResponse += `${doc.pageContent}\n\n`
        })
      }
    }

    return contextResponse
  }

  clear(): void {
    this.vectorStore = null
    this.bookMetadata = null
  }
}
