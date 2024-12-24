import { useState } from 'react'
import { BookmarkIcon, ChatBubbleLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import * as pdfjsLib from 'pdfjs-dist'

interface PDFOutlineWithPage extends pdfjsLib.PDFOutline {
  pageNumber?: number
}

interface SidebarProps {
  outline: PDFOutlineWithPage[]
  onJumpToPage: (page: number) => void
  annotations: Array<{
    id: string
    pageNumber: number
    content: string
  }>
  highlights: Array<{
    id: string
    pageNumber: number
    content: string
  }>
}

export default function Sidebar({ outline, onJumpToPage, annotations, highlights }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'outline' | 'annotations' | 'highlights'>('outline')

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('outline')}
          className={`flex-1 p-4 text-sm font-medium ${
            activeTab === 'outline' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookmarkIcon className="w-5 h-5 mx-auto mb-1" />
          Outline
        </button>
        <button
          onClick={() => setActiveTab('annotations')}
          className={`flex-1 p-4 text-sm font-medium ${
            activeTab === 'annotations'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ChatBubbleLeftIcon className="w-5 h-5 mx-auto mb-1" />
          Notes
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 p-4 text-sm font-medium ${
            activeTab === 'highlights' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <DocumentTextIcon className="w-5 h-5 mx-auto mb-1" />
          Highlights
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'outline' && (
          <div className="space-y-2">
            {outline.map((item, index) => (
              <button
                key={index}
                onClick={() => item.pageNumber && onJumpToPage(item.pageNumber)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors"
              >
                {item.title}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'annotations' && (
          <div className="space-y-4">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="text-sm font-medium mb-1">Page {annotation.pageNumber}</div>
                <div className="text-sm text-gray-300">{annotation.content}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'highlights' && (
          <div className="space-y-4">
            {highlights.map((highlight) => (
              <div key={highlight.id} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="text-sm font-medium mb-1">Page {highlight.pageNumber}</div>
                <div className="text-sm text-gray-300">{highlight.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
