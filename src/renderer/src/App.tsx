import { useState } from 'react'
import Layout from './components/layout/Layout'
import ModelSelector from './components/models/ModelSelector'
import Chat from './components/chat/Chat'
import type { OllamaModel } from './types/ollama'

function App(): JSX.Element {
  const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null)

  return (
    <Layout>
      {!selectedModel ? (
        <ModelSelector onModelSelect={setSelectedModel} />
      ) : (
        <Chat model={selectedModel} setModel={setSelectedModel} />
      )}
    </Layout>
  )
}

export default App
