import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { OllamaModel } from '../../types/ollama'
import ModelDropdown from '../models/ModelDropdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Conversation, Message as MessageType } from 'src/shared/types'

interface ChatProps {
  model: OllamaModel
  setModel: (model: OllamaModel) => void
  conversation: Conversation | null
}

export default function Chat({ model, setModel, conversation }: ChatProps): JSX.Element {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<string>('')

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      window.api.conversations.messages(conversation.id).then(setMessages)
    } else {
      setMessages([])
    }
  }, [conversation])

  // Enhanced auto-scroll effect
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll on messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set up streaming listener with scroll
  useEffect(() => {
    let currentMessage = ''

    const handleStream = (content: string) => {
      currentMessage += content
      setMessages((prev) => {
        const newMessages = [...prev]
        if (newMessages.length > 0 && conversation) {
          newMessages[newMessages.length - 1] = {
            id: 'streaming',
            conversationId: conversation.id,
            role: 'assistant',
            content: currentMessage,
            createdAt: Date.now()
          }
        }
        // Only scroll if content actually changed
        if (lastMessageRef.current !== currentMessage) {
          lastMessageRef.current = currentMessage
          setTimeout(scrollToBottom, 0)
        }
        return newMessages
      })
    }

    window.api.chat.onStream(handleStream)
    return () => {
      window.api.chat.offStream()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating || !conversation) return

    const userMessage = await window.api.conversations.addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: input
    })

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)

    try {
      setMessages((prev) => [
        ...prev,
        {
          id: 'temp',
          conversationId: conversation.id,
          role: 'assistant',
          content: '',
          createdAt: Date.now()
        }
      ])

      await window.api.chat.completion({
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        model: model.name
      })
    } catch (error) {
      console.error('Failed to get response:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const customComponents = {
    code({ className, children }) {
      const language = className ? className.replace('language-', '') : ''
      const isInline = !className

      return isInline ? (
        <code className="px-1.5 py-0.5 rounded-md bg-gray-700/50 text-sm">{children}</code>
      ) : (
        <div className="relative my-4 rounded-lg overflow-hidden">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              background: '#1E1E1E'
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <ModelDropdown selectedModel={model} onModelSelect={(newModel) => setModel(newModel)} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            >
              <ReactMarkdown components={customComponents}>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} /> {/* Scroll anchor */}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            className="flex-1 p-2 rounded-lg border dark:border-gray-700 
                     dark:bg-gray-800 focus:outline-none focus:ring-2"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                     disabled:opacity-50 hover:bg-blue-600"
          >
            {isGenerating ? 'Generating...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
