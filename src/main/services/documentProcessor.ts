import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

export interface ProcessedDocument {
  id: string
  filename: string
  chunks: number
  createdAt: string
}

export class DocumentProcessor {
  private embeddings: OllamaEmbeddings
  private vectorStore: MemoryVectorStore | null = null

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434'
    })
    this.initializeVectorStore()
  }

  private async initializeVectorStore() {
    this.vectorStore = await MemoryVectorStore.fromTexts(
      ['initialization'],
      [{ initialized: true }],
      this.embeddings
    )
  }

  async processFile(filePath: string): Promise<ProcessedDocument> {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const filename = path.basename(filePath)

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    })

    const docs = await splitter.createDocuments([fileContent])
    const documentId = uuidv4()

    const processedDocs = docs.map((doc) => {
      doc.metadata = {
        ...doc.metadata,
        documentId,
        filename
      }
      return doc
    })

    if (!this.vectorStore) {
      await this.initializeVectorStore()
    }

    if (this.vectorStore) {
      await this.vectorStore.addDocuments(processedDocs)
    }

    return {
      id: documentId,
      filename,
      chunks: docs.length,
      createdAt: new Date().toISOString()
    }
  }

  async queryDocuments(query: string, numResults: number = 3): Promise<Document[]> {
    if (!this.vectorStore) {
      return []
    }

    const results = await this.vectorStore.similaritySearch(query, numResults)
    return results
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.vectorStore) return

    await this.vectorStore.delete({
      filter: { documentId }
    })
  }
}
