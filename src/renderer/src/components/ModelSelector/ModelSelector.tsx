import { useState, useEffect } from 'react'

interface ModelSelectorProps {
  onModelSelect: (model: string) => void
  currentModel: string
}

export default function ModelSelector({ onModelSelect, currentModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await window.api.getModels()
        if (response.success && response.data) {
          setAvailableModels(response.data)
        } else {
          throw new Error(response.error || 'Failed to fetch models')
        }
      } catch (err) {
        setError('Failed to load models. Is Ollama running?')
        console.error('Error fetching models:', err)
      }
    }

    fetchModels()
  }, [])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-gray-200">Model: {currentModel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && availableModels.length > 0 && (
        <div className="absolute top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10">
          {availableModels.map((model) => (
            <button
              key={model}
              onClick={() => {
                onModelSelect(model)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${
                currentModel === model ? 'bg-gray-700' : ''
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
