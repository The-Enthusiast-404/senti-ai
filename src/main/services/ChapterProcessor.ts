import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OllamaEmbeddings } from './OllamaEmbeddings'

interface ChapterSection {
  title: string
  content: string
  level: number
  subsections: ChapterSection[]
}

interface Chapter {
  title: string
  startPage: number
  endPage: number
  content: string
  sections: ChapterSection[]
}

export class ChapterProcessor {
  private vectorStore: MemoryVectorStore | null = null
  private chapters: Map<string, Chapter> = new Map()
  private embeddings: OllamaEmbeddings

  constructor() {
    this.embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text'
    })
  }

  private detectSections(content: string): ChapterSection[] {
    const lines = content.split('\n')
    const sections: ChapterSection[] = []
    let currentSection: ChapterSection | null = null
    let currentContent: string[] = []

    for (const line of lines) {
      // Detect heading level based on common patterns
      const headingMatch =
        line.match(/^(#{1,6})\s+(.+)$/) || // Markdown style
        line.match(/^([A-Z][^.!?]+)$/) || // All caps
        line.match(/^(\d+\.[\d.]*)\s+(.+)$/) // Numbered

      if (headingMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim()
          if (currentSection.level === 1) {
            sections.push(currentSection)
          } else {
            let parent = this.findParentSection(sections, currentSection.level)
            if (parent) {
              parent.subsections.push(currentSection)
            }
          }
        }

        // Start new section
        currentSection = {
          title: headingMatch[2] || headingMatch[1],
          content: '',
          level: headingMatch[1].startsWith('#') ? headingMatch[1].length : 1,
          subsections: []
        }
        currentContent = []
      } else if (line.trim() && currentSection) {
        currentContent.push(line)
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim()
      if (currentSection.level === 1) {
        sections.push(currentSection)
      } else {
        let parent = this.findParentSection(sections, currentSection.level)
        if (parent) {
          parent.subsections.push(currentSection)
        }
      }
    }

    return sections
  }

  private findParentSection(
    sections: ChapterSection[],
    currentLevel: number
  ): ChapterSection | null {
    for (const section of sections) {
      if (section.level < currentLevel) {
        return section
      }
      const found = this.findParentSection(section.subsections, currentLevel)
      if (found) return found
    }
    return null
  }

  async addChapter(
    title: string,
    startPage: number,
    endPage: number,
    content: string
  ): Promise<void> {
    const sections = this.detectSections(content)
    this.chapters.set(title, { title, startPage, endPage, content, sections })

    // Create embeddings for each section and subsection
    const documents: { content: string; metadata: any }[] = []

    const processSection = (section: ChapterSection, path: string[]) => {
      documents.push({
        content: section.content,
        metadata: {
          title,
          startPage,
          endPage,
          isChapter: true,
          sectionTitle: section.title,
          sectionPath: [...path, section.title].join(' > '),
          level: section.level
        }
      })

      section.subsections.forEach((subsection) => {
        processSection(subsection, [...path, section.title])
      })
    }

    sections.forEach((section) => processSection(section, []))

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 400
    })

    const docs = await textSplitter.createDocuments(
      documents.map((d) => d.content),
      documents.map((d) => d.metadata)
    )

    if (!this.vectorStore) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings)
    } else {
      await this.vectorStore.addDocuments(docs)
    }
  }

  async getChapterContext(query: string, currentPage: number): Promise<string> {
    const chapter = this.getChapterForPage(currentPage)
    if (!chapter) return ''

    // Create a detailed chapter overview
    let contextResponse = `Chapter: ${chapter.title}\n`
    contextResponse += `Pages: ${chapter.startPage} - ${chapter.endPage}\n\n`
    contextResponse += 'Chapter Structure:\n'

    // Add section summaries
    const formatSections = (sections: ChapterSection[], level = 0): string => {
      return sections
        .map((section) => {
          const indent = '  '.repeat(level)
          let sectionText = `${indent}• ${section.title}\n`
          if (section.content.trim()) {
            sectionText += `${indent}  Summary: ${section.content.slice(0, 200)}...\n`
          }
          if (section.subsections.length > 0) {
            sectionText += formatSections(section.subsections, level + 1)
          }
          return sectionText
        })
        .join('\n')
    }

    contextResponse += formatSections(chapter.sections)

    // If vector store exists, add relevant content based on query
    if (this.vectorStore) {
      const relevantDocs = await this.vectorStore.similaritySearch(query, 5)
      const filteredDocs = relevantDocs.filter(
        (doc) => doc.metadata.isChapter && doc.metadata.title === chapter.title
      )

      if (filteredDocs.length > 0) {
        contextResponse += '\n\nRelevant Content for Your Query:\n'
        filteredDocs.forEach((doc) => {
          contextResponse += `\nFrom Section: ${doc.metadata.sectionPath}\n`
          contextResponse += `${doc.pageContent}\n`
        })
      }
    }

    return contextResponse
  }

  private formatChapterSections(sections: ChapterSection[], level = 0): string {
    return sections
      .map((section) => {
        const indent = '  '.repeat(level)
        const content = `${indent}${section.title}\n${indent}${section.content}`
        if (section.subsections.length > 0) {
          return `${content}\n${this.formatChapterSections(section.subsections, level + 1)}`
        }
        return content
      })
      .join('\n\n')
  }

  getChapterForPage(pageNumber: number): Chapter | null {
    for (const chapter of this.chapters.values()) {
      if (pageNumber >= chapter.startPage && pageNumber <= chapter.endPage) {
        return chapter
      }
    }
    return null
  }

  clear(): void {
    this.vectorStore = null
    this.chapters.clear()
  }

  getChapters(): Map<string, Chapter> {
    return this.chapters
  }
}
