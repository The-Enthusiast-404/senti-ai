import { useEffect } from 'react'
import { TabType, useTabStore } from '../../stores/tabStore'
import ChatInterface from '../Chat/ChatInterface'
import ThemeToggle from '../Theme/ThemeToggle'
import PDFViewer from '../PDFViewer/PDFViewer'

export default function TabManager() {
  const { tabs, activeTabId, createTab, closeTab, setActiveTab } = useTabStore()

  const getInitialTitle = (type: TabType): string => {
    switch (type) {
      case 'chat':
        return 'New Chat'
      case 'pdf':
        return 'PDF Viewer'
      case 'settings':
        return 'Settings'
      default:
        return 'New Tab'
    }
  }

  useEffect(() => {
    if (tabs.length === 0) {
      createTab('chat')
    }
  }, [])

  const getTabIcon = (type: TabType) => {
    switch (type) {
      case 'chat':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'chat':
        return <ChatInterface key={tab.id} tabId={tab.id} />
      case 'pdf':
        return <PDFViewer key={tab.id} tabId={tab.id} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-dark-400">
      <div className="flex items-center bg-white dark:bg-dark-50 px-2 py-1 border-b border-gray-200 dark:border-dark-100">
        <div className="flex-1 flex items-center space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center px-3 py-2 rounded-t-lg cursor-pointer transition-colors ${
                activeTabId === tab.id
                  ? 'bg-gray-100 dark:bg-dark-100 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {getTabIcon(tab.type)}
              <span className="ml-2 truncate max-w-xs">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <ThemeToggle />
        <div className="flex items-center space-x-2 px-2">
          {['chat', 'pdf'].map((type) => (
            <button
              key={type}
              onClick={() => createTab(type as TabType, getInitialTitle(type as TabType))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              title={`New ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            >
              {getTabIcon(type as TabType)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div key={tab.id} className={`h-full ${activeTabId === tab.id ? 'block' : 'hidden'}`}>
            {renderTabContent(tab)}
          </div>
        ))}
      </div>
    </div>
  )
}
