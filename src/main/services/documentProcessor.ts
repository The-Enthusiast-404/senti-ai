import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

interface FileMetadata {
  documentId: string
  filename: string
  extension: string
  size: number
  uploadedAt: string
  lastAccessed?: string
}

export class DocumentProcessor {
  private embeddings: OllamaEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  private metadata: Map<string, FileMetadata> = new Map()

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434'
    })
  }

  private async initializeVectorStore() {
    this.vectorStore = await MemoryVectorStore.fromTexts([], [], this.embeddings)
  }

  async processFile(filePath: string) {
    if (!this.vectorStore) {
      await this.initializeVectorStore()
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const filename = path.basename(filePath)
    const extension = path.extname(filePath)
    const stats = fs.statSync(filePath)

    const documentId = uuidv4()
    const metadata: FileMetadata = {
      documentId,
      filename,
      extension,
      size: stats.size,
      uploadedAt: new Date().toISOString()
    }

    this.metadata.set(documentId, metadata)

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    })

    const docs = await splitter.createDocuments([fileContent])
    const processedDocs = docs.map((doc) => {
      doc.metadata = {
        ...doc.metadata,
        ...metadata
      }
      return doc
    })

    if (this.vectorStore) {
      await this.vectorStore.addDocuments(processedDocs)
    }

    return {
      id: documentId,
      filename,
      chunks: docs.length,
      createdAt: metadata.uploadedAt
    }
  }

  async queryDocuments(query: string, numResults: number = 3): Promise<Document[]> {
    if (!this.vectorStore) {
      return []
    }

    const results = await this.vectorStore.similaritySearch(query, numResults)

    // Update last accessed timestamp for retrieved documents
    results.forEach((doc) => {
      const metadata = this.metadata.get(doc.metadata.documentId)
      if (metadata) {
        metadata.lastAccessed = new Date().toISOString()
      }
    })

    return results
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.vectorStore) return

    try {
      // Get all documents from vector store
      const allDocs = await this.vectorStore.similaritySearch('', 1000)

      // Filter out the document we want to delete
      const remainingDocs = allDocs.filter((doc) => doc.metadata.documentId !== documentId)

      // Create a new vector store with remaining documents
      this.vectorStore = await MemoryVectorStore.fromDocuments(remainingDocs, this.embeddings)

      // Remove from metadata
      this.metadata.delete(documentId)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }

  getDocumentMetadata(documentId: string): FileMetadata | undefined {
    return this.metadata.get(documentId)
  }
}
