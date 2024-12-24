import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface BookCardProps {
  title: string
  lastOpened?: Date
  thumbnail?: string
  onClick: () => void
}

export default function BookCard({
  title,
  lastOpened,
  thumbnail,
  onClick
}: BookCardProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
    >
      <div className="aspect-[3/4] mb-4 bg-gray-700 rounded-md flex items-center justify-center">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover rounded-md" />
        ) : (
          <DocumentTextIcon className="w-16 h-16 text-gray-500" />
        )}
      </div>
      <h3 className="font-medium text-white group-hover:text-primary">{title}</h3>
      {lastOpened && (
        <p className="text-sm text-gray-400">Last opened: {lastOpened.toLocaleDateString()}</p>
      )}
    </div>
  )
}
