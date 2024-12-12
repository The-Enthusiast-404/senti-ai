import { ReactNode, useState } from 'react'
import ConversationList from '../sidebar/ConversationList'
import type { Conversation } from '../../../../shared/types'

interface LayoutProps {
  children: ReactNode
  onSelectConversation?: (conversation: Conversation) => void
}

export default function Layout({ children, onSelectConversation }: LayoutProps): JSX.Element {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Senti AI</h1>
          {onSelectConversation && <ConversationList onSelectConversation={onSelectConversation} />}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
}
