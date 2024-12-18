interface FileListProps {
  files: Array<{
    id: string
    filename: string
    chunks: number
    createdAt: string
  }>
  onDelete: (id: string) => Promise<void>
  compact?: boolean
}

export default function FileList({ files, onDelete, compact = false }: FileListProps) {
  if (files.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'px-4 py-2' : ''}`}>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1"
        >
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm text-gray-700 dark:text-gray-300">{file.filename}</span>
          <button
            onClick={() => onDelete(file.id)}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
