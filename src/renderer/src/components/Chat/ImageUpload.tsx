import { useState } from 'react'

interface ImageUploadProps {
  onImageSelect: (base64Image: string) => void
}

export default function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Image = e.target?.result as string
      onImageSelect(base64Image)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
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
        input.accept = 'image/*'
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            handleImageUpload(file)
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm text-gray-400">Drop an image here or click to upload</p>
      </div>
    </div>
  )
}
