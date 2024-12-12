import { useState, useEffect } from 'react'
import type { Conversation } from '../../../../shared/types'

export default function ConversationList({
  onSelectConversation
}: {
  onSelectConversation: (conversation: Conversation) => void
}): JSX.Element {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    const list = await window.api.conversations.list()
    setConversations(list)
  }

  const handleNewChat = async () => {
    const newConversation = await window.api.conversations.create({
      title: 'New Chat',
      model: 'llama2' // Default model, you might want to make this configurable
    })
    await loadConversations()
    onSelectConversation(newConversation)
  }

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await window.api.conversations.delete(id)
    await loadConversations()
  }

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={handleNewChat}
        className="w-full px-4 py-2 mb-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className="flex justify-between items-center p-3 hover:bg-gray-700 cursor-pointer"
          >
            <span className="truncate">{conversation.title}</span>
            <button
              onClick={(e) => handleDeleteConversation(conversation.id, e)}
              className="text-gray-400 hover:text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
