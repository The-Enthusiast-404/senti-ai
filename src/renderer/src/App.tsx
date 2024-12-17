import ThemeProvider from './components/Theme/ThemeProvider'
import TabManager from './components/TabManager/TabManager'

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-dark-400 text-gray-900 dark:text-gray-100">
        <TabManager />
      </div>
    </ThemeProvider>
  )
}
