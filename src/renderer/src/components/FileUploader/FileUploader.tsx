import { useRef, useState } from 'react'

interface FileUploaderProps {
  onUpload: (filePath: string) => Promise<void>
}

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    try {
      const files = Array.from(e.target.files || [])
      for (const file of files) {
        await onUpload(file.path)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.cpp,.c,.rb,.php,.sql,.xml,.yaml,.yml"
      />
      <button
        onClick={handleClick}
        type="button"
        disabled={isUploading}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title="Upload files"
      >
        {isUploading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        )}
      </button>
    </>
  )
}
