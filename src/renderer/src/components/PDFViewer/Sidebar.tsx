import { useState } from 'react'

export default function Sidebar(): JSX.Element {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    // TODO: Handle prompt submission
    console.log('Prompt submitted:', prompt)
    setPrompt('')
  }

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
      <h3 className="text-lg font-medium mb-4">AI Assistant</h3>

      <div className="flex-1 overflow-auto mb-4">
        {/* Chat messages will go here */}
        <div className="space-y-4">
          {/* Example message */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              Select text from the PDF and ask me questions about it.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question about the PDF..."
          className="w-full h-32 bg-gray-700/50 border border-gray-600 rounded-lg p-3 
                   text-sm resize-none focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/80 text-white py-2 px-4 
                   rounded-lg transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
