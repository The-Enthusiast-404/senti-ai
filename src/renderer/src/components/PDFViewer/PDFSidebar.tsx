import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface PDFSidebarProps {
  pageText: string
  pageNumber: number
  totalPages: number
  isFileLoaded: boolean
  currentModel: string
}

export default function PDFSidebar({
  pageText,
  pageNumber,
  totalPages,
  isFileLoaded,
  currentModel
}: PDFSidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')

  const predefinedPrompts = [
    {
      title: 'Summarize Page',
      prompt: 'Please provide a concise summary of the following text:'
    },
    {
      title: 'Key Points',
      prompt: 'Extract the main key points from this text:'
    },
    {
      title: 'Explain Concepts',
      prompt: 'Explain the main concepts discussed in this text in simple terms:'
    },
    {
      title: 'Generate Questions',
      prompt: 'Generate 3-5 comprehension questions based on this text:'
    }
  ]

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
