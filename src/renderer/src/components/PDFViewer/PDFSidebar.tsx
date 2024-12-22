import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface PDFSidebarProps {
  pageText: string
  chapterText: string
  bookText: string
  pageNumber: number
  totalPages: number
  isFileLoaded: boolean
  currentModel: string
}

export default function PDFSidebar({
  pageText,
  chapterText,
  bookText,
  pageNumber,
  totalPages,
  isFileLoaded,
  currentModel
}: PDFSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')

  const predefinedPrompts = [
    {
      title: 'Summarize Content',
      prompt: 'Please provide a comprehensive summary of the content:'
    },
    {
      title: 'Extract Key Points',
      prompt: 'Extract and list the main key points from this content:'
    },
    {
      title: 'Explain Concepts',
      prompt: 'Explain the main concepts discussed in this content in simple terms:'
    },
    {
      title: 'Generate Questions',
      prompt: 'Generate 3-5 comprehension questions based on this content:'
    },
    {
      title: 'Analyze Structure',
      prompt:
        'Analyze and break down the structure of this content, identifying main sections and their relationships:'
    }
  ]

  const determineContext = (
    question: string
  ): { context: string; scope: 'page' | 'chapter' | 'book' } => {
    const questionLower = question.toLowerCase()

    // Keywords that indicate scope
    const pageKeywords = ['this page', 'current page', 'on page', 'in page']
    const bookKeywords = ['whole book', 'entire book', 'full book', 'all chapters', 'the book']
    const chapterKeywords = ['this chapter', 'current chapter', 'in chapter', 'the chapter']

    if (pageKeywords.some((keyword) => questionLower.includes(keyword))) {
      return { context: pageText, scope: 'page' }
    }
    if (bookKeywords.some((keyword) => questionLower.includes(keyword))) {
      return { context: bookText, scope: 'book' }
    }
    if (chapterKeywords.some((keyword) => questionLower.includes(keyword))) {
      return { context: chapterText, scope: 'chapter' }
    }

    // Default to the most relevant scope based on question type
    if (questionLower.includes('compare') || questionLower.includes('across')) {
      return { context: bookText, scope: 'book' }
    }

    // Default to chapter for most questions as it provides good context without being too broad
    return { context: chapterText, scope: 'chapter' }
  }

  const handleCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customPrompt.trim() || isLoading) return

    setIsLoading(true)
    setResponse('')

    try {
      await window.api.setModel(currentModel)

      const { context, scope } = determineContext(customPrompt)
      const contextDescription = `You are analyzing ${
        scope === 'page'
          ? `page ${pageNumber} of ${totalPages}`
          : scope === 'chapter'
            ? `the chapter containing page ${pageNumber}`
            : `the entire book (${totalPages} pages)`
      }. Provide a response that's appropriate for this scope.`

      const response = await window.api.chat({
        chatId: null,
        messages: [
          {
            role: 'user',
            content: `${contextDescription}\n\nQuestion: ${customPrompt}\n\nText:\n${context}`,
            type: 'text'
          }
        ],
        useInternetSearch: false
      })

      if (response.success && response.data) {
        setResponse(response.data.content)
      }
    } catch (error) {
      console.error('Failed to analyze text:', error)
      setResponse('Error analyzing the text. Please try again.')
    } finally {
      setIsLoading(false)
      setCustomPrompt('')
    }
  }

  const handlePromptClick = async (promptPrefix: string) => {
    if (!pageText || isLoading) return

    setIsLoading(true)
    setResponse('')

    try {
      await window.api.setModel(currentModel)

      const response = await window.api.chat({
        chatId: null,
        messages: [
          {
            role: 'user',
            content: `${promptPrefix}\n\n${pageText}`,
            type: 'text'
          }
        ],
        useInternetSearch: false
      })

      if (response.success && response.data) {
        setResponse(response.data.content)
      }
    } catch (error) {
      console.error('Failed to analyze text:', error)
      setResponse('Error analyzing the text. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-96 border-l border-gray-200 dark:border-dark-100 flex flex-col h-full bg-gray-50 dark:bg-dark-50">
      <div className="p-4 border-b border-gray-200 dark:border-dark-100">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Analysis</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {!isFileLoaded ? (
            <div className="text-gray-500">Please load a PDF file first</div>
          ) : (
            <>
              <form onSubmit={handleCustomPrompt} className="space-y-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ask any question about the current chapter or page..."
                  className="w-full p-3 bg-white dark:bg-dark-400 rounded-lg shadow border border-gray-200 dark:border-dark-100 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={isLoading || !customPrompt.trim()}
                  className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ask Question
                </button>
              </form>

              <div className="my-4 border-t border-gray-200 dark:border-dark-100" />

              <div className="grid grid-cols-1 gap-2">
                {predefinedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt.prompt)}
                    disabled={isLoading}
                    className="p-3 text-left bg-white dark:bg-dark-400 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    {prompt.title}
                  </button>
                ))}
              </div>

              {isLoading && <div className="text-center p-4 text-gray-500">Analyzing text...</div>}

              {response && (
                <div className="mt-4 p-4 bg-white dark:bg-dark-400 rounded-lg">
                  <ReactMarkdown
                    remarkPlugins={[]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
