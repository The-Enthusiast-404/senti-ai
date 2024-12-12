import { useState, useEffect } from 'react'
import type { OllamaModel } from '../../types/ollama'

interface ModelDropdownProps {
  selectedModel: OllamaModel | null
  onModelSelect: (model: OllamaModel) => void
}

export default function ModelDropdown({
  selectedModel,
  onModelSelect
}: ModelDropdownProps): JSX.Element {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await window.electron.ipcRenderer.invoke('models:list')
        setModels(response.models)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch models:', err)
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-48 px-4 py-2 text-sm 
                 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span>{selectedModel?.name || 'Select a model'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-10 w-48 mt-1 bg-white dark:bg-gray-800 border 
                      border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="max-h-60 overflow-auto">
              {models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => {
                    onModelSelect(model)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 
                           dark:hover:bg-gray-700 focus:outline-none"
                >
                  {model.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
