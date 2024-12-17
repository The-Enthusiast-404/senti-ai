import React from 'react'

interface ContextSourcesProps {
  filesEnabled: boolean
  onRemoveFile: (fileId: string) => void
  files: Array<{ id: string; filename: string }>
}

export default function ContextSources({ filesEnabled, files, onRemoveFile }: ContextSourcesProps) {
  if (!filesEnabled) return null

  return (
    <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
      <div className="flex flex-wrap gap-2">
        {filesEnabled &&
          files.map((file) => (
            <span
              key={file.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-600/20 text-purple-400 border border-purple-600/30"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {file.filename}
              <button onClick={() => onRemoveFile(file.id)} className="ml-1 hover:text-purple-200">
                ×
              </button>
            </span>
          ))}
      </div>
    </div>
  )
}
