import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { useChatStore } from './chatStore'

export type TabType = 'chat' | 'code' | 'stock' | 'settings'

interface Tab {
  id: string
  type: TabType
  title: string
  chatId?: string
}

interface TabStore {
  tabs: Tab[]
  activeTabId: string | null
  createTab: (type: TabType, chatId?: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabTitle: (id: string, title: string) => void
  updateTabChatId: (id: string, chatId: string) => void
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  createTab: (type, chatId) => {
    const newTab: Tab = {
      id: uuidv4(),
      type,
      title: getInitialTitle(type),
      chatId
    }
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id
    }))

    if (type === 'chat') {
      useChatStore.getState().createNewChat()
    }
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
