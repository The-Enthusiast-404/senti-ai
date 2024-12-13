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

export default function MessageContent({ content, type, isUser }: MessageContentProps) {
  if (type === 'image') {
    return (
      <div className="max-w-sm">
        <img src={content} alt="Uploaded content" className="rounded-lg max-w-full h-auto" />
      </div>
    )
  }

  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-3">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 pl-4">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-2">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-500 pl-4 italic bg-gray-800/50 py-2 rounded">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-dotted"
            >
              {children}
              <svg
                className="w-3 h-3 inline-block ml-1"
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
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          table: ({ children }) => (
            <table className="border-collapse w-full my-4">{children}</table>
          ),
          thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-gray-900">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-gray-700">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-gray-700 px-4 py-2 text-left">{children}</th>
          ),
          td: ({ children }) => <td className="border border-gray-700 px-4 py-2">{children}</td>,
          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
          strong: ({ children }) => <strong className="font-bold text-gray-100">{children}</strong>,
          hr: () => <hr className="border-gray-700 my-4" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
