import { useState, useEffect } from 'react'
import ChatInterface from '../Chat/ChatInterface'
import CodeGenerator from '../CodeGeneration/CodeGenerator'
import StockViewer from '../Stocks/StockViewer'
import { v4 as uuidv4 } from 'uuid'

interface Tab {
  id: string
  type: 'chat' | 'code' | 'stock' | 'settings'
  title: string
  chatId?: string
}

export default function TabManager() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab('chat')
    }
  }, [])

  const createNewTab = (type: Tab['type'], chatId?: string) => {
    const newTab: Tab = {
      id: uuidv4(),
      type,
      title: getInitialTitle(type),
      chatId
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const getInitialTitle = (type: Tab['type']) => {
    switch (type) {
      case 'chat':
        return 'New Chat'
      case 'code':
        return 'Code Generator'
      case 'stock':
        return 'Stock Analysis'
      default:
        return 'New Tab'
    }
  }

  const updateTabTitle = (tabId: string, newTitle: string) => {
    setTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, title: newTitle } : tab)))
  }

  const closeTab = (tabId: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId) {
      setActiveTabId(newTabs[newTabs.length - 1]?.id || null)
    }

    if (newTabs.length === 0) {
      createNewTab('chat')
    }
  }

  const getTabIcon = (type: Tab['type']) => {
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
      case 'code':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        )
      case 'stock':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 8v8m-4-5v5M8 8v8M4 12h16"
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
        return <ChatInterface />
      case 'code':
        return <CodeGenerator />
      case 'stock':
        return <StockViewer onClose={() => closeTab(tab.id)} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-800 px-2 py-1 border-b border-gray-700">
        <div className="flex-1 flex items-center space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center px-3 py-2 rounded-t-lg cursor-pointer transition-colors ${
                activeTabId === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {getTabIcon(tab.type)}
              <span className="ml-2 truncate max-w-xs">{tab.title}</span>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 px-2">
          <button
            onClick={() => createNewTab('chat')}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            title="New Chat"
          >
            {getTabIcon('chat')}
          </button>
          <button
            onClick={() => createNewTab('code')}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            title="Code Generator"
          >
            {getTabIcon('code')}
          </button>
          <button
            onClick={() => createNewTab('stock')}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
            title="Stock Analysis"
          >
            {getTabIcon('stock')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
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
