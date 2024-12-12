import { useState, useEffect } from 'react'
import type { OllamaModel } from '../../types/ollama'

interface ModelSelectorProps {
  onModelSelect: (model: OllamaModel) => void
}

export default function ModelSelector({ onModelSelect }: ModelSelectorProps): JSX.Element {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await window.electron.ipcRenderer.invoke('models:list')
        setModels(response.models)
        setLoading(false)
      } catch (err) {
        setError('Failed to fetch models. Is Ollama running?')
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-600 dark:text-gray-300">Loading models...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Select a Model</h2>
      <div className="grid grid-cols-1 gap-4">
        {models.map((model) => (
          <button
            key={model.name}
            onClick={() => onModelSelect(model)}
            className="flex items-center justify-between p-4 rounded-lg
                     border border-gray-200 dark:border-gray-700
                     hover:bg-gray-50 dark:hover:bg-gray-800
                     transition-colors duration-150"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Size: {Math.round(model.size / 1024 / 1024 / 1024)}GB
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
