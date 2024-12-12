import { useState, FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import type { OllamaModel } from '../../types/ollama'
import ModelDropdown from '../models/ModelDropdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatProps {
  model: OllamaModel
}

export default function Chat({ model }: ChatProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      console.log('Sending chat request...') // Debug log
      const response = await window.electron.ipcRenderer.invoke('chat:completion', {
        messages: [...messages, userMessage],
        model: model.name
      })
      console.log('Got response:', response) // Debug log

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: typeof response === 'string' ? response : JSON.stringify(response)
        }
      ])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b dark:border-gray-700 p-4">
        <ModelDropdown selectedModel={model} onModelSelect={(newModel) => console.log(newModel)} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
              }`}
            >
              <ReactMarkdown>{message.content || ''}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">Thinking...</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-700 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-600 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
