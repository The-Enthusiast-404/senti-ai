import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'

interface MessageContentProps {
  content: string
  type: 'text' | 'image'
  isUser: boolean
}

interface Source {
  id: number
  title: string
  url: string
  domain: string
}

interface FormattedResponse {
  content: string
  sources: Source[]
}

export default function MessageContent({ content, type, isUser }: MessageContentProps) {
  if (type === 'image') {
    return (
      <div className="max-w-sm">
        <img src={content} alt="Uploaded content" className="rounded-lg max-w-full h-auto" />
      </div>
    )
  }

  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  let formattedContent = ''
  let sources: Source[] = []

  // Handle the response object
  if (typeof content === 'object' && content !== null) {
    const response = content as any
    formattedContent = response.content || ''
    sources = response.sources || []
  } else {
    try {
      const parsed = JSON.parse(content)
      if (typeof parsed === 'object' && parsed !== null) {
        formattedContent = parsed.content || ''
        sources = Array.isArray(parsed.sources) ? parsed.sources : []
      }
    } catch (e) {
      formattedContent = String(content)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className={`${isUser ? 'text-white' : 'text-gray-200'} space-y-4`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const code = String(children).replace(/\n$/, '')

            if (!inline && match) {
              return (
                <div className="relative my-4">
                  <div className="absolute left-0 right-0 top-0 flex justify-between items-center bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700">
                    <span className="text-xs font-medium text-gray-400">
                      {match[1].toUpperCase()}
                    </span>
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedCode === code ? (
                        <span className="text-green-400 text-sm">Copied!</span>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={match[1]}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      paddingTop: '3rem',
                      backgroundColor: '#1e1e1e'
                    }}
                    {...props}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              )
            }
            return (
              <code
                className="bg-gray-800 text-gray-200 rounded-md px-1.5 py-0.5 text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
        }}
      >
        {String(formattedContent)}
      </ReactMarkdown>

      {sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
              >
                <span className="mr-1.5 text-gray-500">[{source.id}]</span>
                <span className="mr-1.5">{source.domain}</span>
                <svg
                  className="w-3 h-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
