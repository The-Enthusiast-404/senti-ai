import { useState } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/plain' || file.type === 'application/pdf')) {
      onFileSelect(file)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50/10' : 'border-gray-600 hover:border-blue-500'}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.txt,.pdf'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            onFileSelect(file)
          }
        }
        input.click()
      }}
    >
      <div className="flex flex-col items-center space-y-2">
        <svg
          className="w-8 h-8 text-gray-400"
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
        <p className="text-sm text-gray-400">Drop a file here or click to upload</p>
        <p className="text-xs text-gray-500">Supports: TXT, PDF</p>
      </div>
    </div>
  )
}
