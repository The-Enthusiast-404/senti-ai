import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'

interface MessageContentProps {
  content: string
  type: 'text' | 'image'
  isUser: boolean
}

export default function MessageContent({ content, type, isUser }: MessageContentProps) {
  if (type === 'image') {
    return <img src={content} alt="Generated" className="max-w-full rounded-lg" />
  }

  return (
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
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
