import { useState, useEffect } from 'react'

interface SystemPrompt {
  id: string
  name: string
  content: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

interface SystemPromptManagerProps {
  onSelectPrompt: (prompt: SystemPrompt | null) => void
  currentPrompt: SystemPrompt | null
}

export default function SystemPromptManager({
  onSelectPrompt,
  currentPrompt
}: SystemPromptManagerProps) {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    content: '',
    description: '',
    category: ''
  })

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const response = await window.api.systemPrompt.getAll()
      if (response.success && response.data) {
        setPrompts(response.data)
      }
    } catch (error) {
      console.error('Failed to load system prompts:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await window.api.systemPrompt.create(newPrompt)
      if (response.success) {
        setIsCreating(false)
        setNewPrompt({ name: '', content: '', description: '', category: '' })
        await loadPrompts()
      }
    } catch (error) {
      console.error('Failed to create system prompt:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const response = await window.api.systemPrompt.delete(id)
      if (response.success) {
        await loadPrompts()
      }
    } catch (error) {
      console.error('Failed to delete system prompt:', error)
    }
  }

  return (
    <div className="p-4 bg-gray-900 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">System Prompts</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New
        </button>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={newPrompt.category}
                onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg h-32"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{prompt.name}</h3>
                <span className="text-sm text-gray-400">{prompt.category}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onSelectPrompt(prompt)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {currentPrompt?.id === prompt.id ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2">{prompt.description}</p>
            <pre className="text-sm bg-gray-700 p-2 rounded overflow-auto">{prompt.content}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
