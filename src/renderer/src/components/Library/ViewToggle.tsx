import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

interface ViewToggleProps {
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded ${
          view === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Squares2X2Icon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded ${
          view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        <ListBulletIcon className="w-5 h-5" />
      </button>
    </div>
  )
}
