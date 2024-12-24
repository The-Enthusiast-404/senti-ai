import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OllamaEmbeddings } from './OllamaEmbeddings'
import { ChapterProcessor } from './ChapterProcessor'
import { BookProcessor } from './BookProcessor'

export class DocumentProcessor {
  private vectorStore: MemoryVectorStore | null = null
  private pageContexts: Map<number, string> = new Map()
  private embeddings: OllamaEmbeddings
  private chapterProcessor: ChapterProcessor
  private bookProcessor: BookProcessor

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text'
    })
    this.chapterProcessor = new ChapterProcessor()
    this.bookProcessor = new BookProcessor()
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

  async getPageContext(pageNumber: number, query: string): Promise<string> {
    if (!this.vectorStore) {
      return this.pageContexts.get(pageNumber) || ''
    }

    const relevantDocs = await this.vectorStore.similaritySearch(query, 3)

    // Filter for current page context
    const filteredDocs = relevantDocs.filter((doc) => doc.metadata.pageNumber === pageNumber)

    return filteredDocs.map((doc) => doc.pageContent).join('\n\n')
  }

  async getRelevantContext(
    pageNumber: number,
    query: string,
    isBookAction?: boolean
  ): Promise<string> {
    if (!this.vectorStore) {
      return this.pageContexts.get(pageNumber) || ''
    }

    if (isBookAction) {
      return this.bookProcessor.getBookContext(query)
    }

    const [pageContext, chapterContext] = await Promise.all([
      this.getPageContext(pageNumber, query),
      this.chapterProcessor.getChapterContext(query, pageNumber)
    ])

    return `Page Context:\n${pageContext}\n\nChapter Context:\n${chapterContext}`
  }

  async processChapter(title: string, startPage: number, endPage: number): Promise<void> {
    const chapterContent = Array.from(this.pageContexts.entries())
      .filter(([page]) => page >= startPage && page <= endPage)
      .map(([_, content]) => content)
      .join('\n\n')

    await this.chapterProcessor.addChapter(title, startPage, endPage, chapterContent)

    // Update book processor with new chapter info
    await this.bookProcessor.updateBookMetadata({
      title: 'Book Title', // You might want to store this somewhere
      totalPages: Math.max(...Array.from(this.pageContexts.keys())),
      chapters: Array.from(this.chapterProcessor.getChapters().values()).map((chapter) => ({
        title: chapter.title,
        startPage: chapter.startPage,
        endPage: chapter.endPage
      }))
    })
  }

  clear(): void {
    this.vectorStore = null
    this.pageContexts.clear()
    this.chapterProcessor.clear()
    this.bookProcessor.clear()
  }

  getChapterForPage(pageNumber: number) {
    return this.chapterProcessor.getChapterForPage(pageNumber)
  }
}
