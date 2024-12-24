import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface BookCardProps {
  title: string
  lastOpened?: Date
  thumbnail?: string
  onClick: () => void
  view: 'grid' | 'list'
}

export default function BookCard({
  title,
  lastOpened,
  thumbnail,
  onClick,
  view
}: BookCardProps): JSX.Element {
  if (view === 'list') {
    return (
      <div
        onClick={onClick}
        className="group cursor-pointer bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 
                 hover:bg-gray-700/50 transition-all duration-200 flex items-center gap-6
                 border border-gray-700/50 hover:border-gray-600"
      >
        <div
          className="w-20 h-28 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0
                    shadow-lg group-hover:shadow-xl transition-all duration-200 overflow-hidden"
        >
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <DocumentTextIcon className="w-10 h-10 text-gray-500" />
          )}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-medium text-white group-hover:text-primary transition-colors">
            {title}
          </h3>
          {lastOpened && (
            <p className="text-sm text-gray-400 mt-1">
              Last opened: {lastOpened.toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300">PDF</span>
            <span className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300">
              2.3 MB
            </span>
          </div>
        </div>
      </div>
    )
  }

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
