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
        className="bg-white dark:bg-dark-50 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-dark-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
