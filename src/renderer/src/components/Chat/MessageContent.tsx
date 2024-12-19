import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'

interface MessageContentProps {
  content: string
  type: 'text' | 'image'
  isUser: boolean
  sources?: Array<{
    title: string
    url: string
    domain: string
  }>
}

export default function MessageContent({ content, type, isUser, sources }: MessageContentProps) {
  if (type === 'image') {
    return <img src={content} alt="Generated" className="max-w-full rounded-lg" />
  }

  return (
    <div className="space-y-4">
      <div className={`prose ${isUser ? 'text-white' : 'dark:prose-invert'} max-w-none`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              )
            },
            a({ href, children }) {
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault()
                    if (href) {
                      window.electron.shell
                        .openExternal(href)
                        .catch((err) => console.error('Failed to open URL:', err))
                    }
                  }}
                  className="text-blue-500 hover:text-blue-400 underline cursor-pointer"
                >
                  {children}
                </a>
              )
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {!isUser && sources && sources.length > 0 && (
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="text-sm text-gray-400 mb-2">Sources:</div>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                onClick={(e) => {
                  e.preventDefault()
                  window.electron.shell
                    .openExternal(source.url)
                    .catch((err) => console.error('Failed to open URL:', err))
                }}
                className="text-sm px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded-full text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {source.domain}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
