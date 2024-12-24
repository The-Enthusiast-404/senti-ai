import { ArrowUpRightIcon } from '@heroicons/react/24/outline'

interface TextSelectionPopupProps {
  position: { x: number; y: number } | null
  selectedText: string
  onAskAboutSelection: () => void
}

export function TextSelectionPopup({
  position,
  selectedText,
  onAskAboutSelection
}: TextSelectionPopupProps) {
  if (!position || !selectedText) return null

  return (
    <div
      className="fixed z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <button
        onClick={onAskAboutSelection}
        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <ArrowUpRightIcon className="w-4 h-4" />
        <span className="text-sm">Ask about selection</span>
      </button>
    </div>
  )
}
