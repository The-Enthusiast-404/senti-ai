import Layout from './components/layout/Layout'

function App(): JSX.Element {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Welcome to Senti AI
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Start a conversation with your local LLM
        </p>
      </div>
    </Layout>
  )
}

export default App
