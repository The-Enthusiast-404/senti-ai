import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { useChatStore } from './chatStore'

export type TabType = 'chat' | 'code' | 'stock' | 'settings'

interface TabState {
  messages: Message[]
  isLoading: boolean
  currentModel: string
  isSidebarOpen: boolean
  currentChatId: string | null
}

interface Tab {
  id: string
  type: TabType
  title: string
  chatId?: string
  state?: TabState
}

interface TabStore {
  tabs: Tab[]
  activeTabId: string | null
  createTab: (type: TabType, title: string, id?: string, initialState?: TabState) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabTitle: (id: string, title: string) => void
  updateTabChatId: (id: string, chatId: string) => void
  updateTabState: (id: string, state: Partial<TabState>) => void
  getTabState: (id: string) => TabState
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  createTab: (type: TabType, title: string, id?: string, initialState?: TabState) => {
    const newTab: Tab = {
      id: id || uuidv4(),
      type,
      title,
      state: initialState || {
        messages: [],
        isLoading: false,
        currentModel: 'llama2',
        isSidebarOpen: true,
        currentChatId: null
      }
    }

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id
    }))

    return newTab
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const newTabs = tabs.filter((tab) => tab.id !== id)

    set((state) => ({
      tabs: newTabs,
      activeTabId: activeTabId === id ? newTabs[newTabs.length - 1]?.id || null : activeTabId
    }))

    if (newTabs.length === 0) {
      get().createTab('chat')
    }
  },

  setActiveTab: (id) => {
    set({ activeTabId: id })
  },

  updateTabTitle: (id, title) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, title } : tab))
    }))
  },

  updateTabChatId: (id, chatId) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, chatId } : tab))
    }))
  },

  updateTabState: (id, newState) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              state: { ...tab.state, ...newState }
            }
          : tab
      )
    }))
  },

  getTabState: (id) => {
    const tab = get().tabs.find((t) => t.id === id)
    return (
      tab?.state || {
        messages: [],
        isLoading: false,
        currentModel: 'llama2',
        isSidebarOpen: false,
        currentChatId: null
      }
    )
  }
}))

function getInitialTitle(type: TabType): string {
  switch (type) {
    case 'chat':
      return 'New Chat'
    case 'code':
      return 'Code Generator'
    case 'stock':
      return 'Stock Analysis'
    case 'settings':
      return 'Settings'
    default:
      return 'New Tab'
  }
}
