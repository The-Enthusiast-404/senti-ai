import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface GeneratedCode {
  code: string
  language: string
  componentName: string
}

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await window.api.generateCode(prompt)
      if (response.success && response.data) {
        setGeneratedCode(response.data)
      } else {
        throw new Error(response.error || 'Failed to generate code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="p-4 border-b border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the component you want to generate..."
            className="flex-1 px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg ${
              isLoading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && <div className="text-red-400 mb-4 p-4 bg-red-900/20 rounded-lg">{error}</div>}

        {generatedCode && (
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{generatedCode.componentName}</h3>
              <button
                onClick={() => copyToClipboard(generatedCode.code)}
                className="text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-gray-800"
              >
                Copy Code
              </button>
            </div>
            <SyntaxHighlighter
              language={generatedCode.language}
              style={vscDarkPlus}
              className="rounded-lg"
            >
              {generatedCode.code}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  )
}
