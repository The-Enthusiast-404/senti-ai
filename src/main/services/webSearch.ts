import { Document } from 'langchain/document'

interface BraveSearchResult {
  title: string
  url: string
  description: string
}

interface BraveSearchResponse {
  web: {
    results: BraveSearchResult[]
  }
}

export class WebSearchService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Brave Search API key is required')
    }
    this.apiKey = apiKey
    this.baseUrl = 'https://api.search.brave.com/res/v1/web/search'
  }

  async search(query: string, numResults: number = 5): Promise<Document[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        count: numResults.toString(),
        text_format: 'plain',
        search_lang: 'en'
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status} - ${await response.text()}`)
      }

      const data = (await response.json()) as BraveSearchResponse

      if (!data.web?.results) {
        return []
      }

      return data.web.results.map((result) => {
        const domain = new URL(result.url).hostname.replace('www.', '')
        return new Document({
          pageContent: result.description,
          metadata: {
            source: result.url,
            title: result.title,
            domain: domain,
            type: 'web_search'
          }
        })
      })
    } catch (error) {
      console.error('Web search error:', error)
      throw error
    }
  }
}
