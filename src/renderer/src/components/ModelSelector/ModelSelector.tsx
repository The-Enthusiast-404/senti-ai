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
      <select
        value={currentModel}
        onChange={(e) => onModelSelect(e.target.value)}
        className="bg-dark-100 text-gray-200 px-3 py-2 rounded-lg border border-dark-50 focus:outline-none focus:ring-2 focus:ring-accent-blue transition-all"
      >
        {availableModels.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  )
}
