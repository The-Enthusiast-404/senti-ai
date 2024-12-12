import { useState } from 'react'
import Layout from './components/layout/Layout'
import ModelSelector from './components/models/ModelSelector'
import Chat from './components/chat/Chat'
import type { OllamaModel } from './types/ollama'
import type { Conversation } from '../../shared/types'

function App(): JSX.Element {
  const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)

  const handleModelSelect = async (model: OllamaModel) => {
    setSelectedModel(model)
    const newConversation = await window.api.conversations.create({
      title: 'New Chat',
      model: model.name
    })
    setCurrentConversation(newConversation)
    window.api.conversations.list()
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setSelectedModel({ name: conversation.model } as OllamaModel)
  }

  return (
    <Layout onSelectConversation={handleConversationSelect}>
      {!selectedModel ? (
        <ModelSelector onModelSelect={handleModelSelect} />
      ) : (
        <Chat
          model={selectedModel}
          setModel={setSelectedModel}
          conversation={currentConversation}
        />
      )}
    </Layout>
  )
}

export default App
