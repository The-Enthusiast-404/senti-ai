import BookCard from './BookCard'
import { PlusIcon } from '@heroicons/react/24/outline'

interface Book {
  id: string
  title: string
  lastOpened?: Date
  thumbnail?: string
}

interface BookGridProps {
  books: Book[]
  onBookClick: (id: string) => void
  onAddBook: () => void
}

export default function BookGrid({ books, onBookClick, onAddBook }: BookGridProps): JSX.Element {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          title={book.title}
          lastOpened={book.lastOpened}
          thumbnail={book.thumbnail}
          onClick={() => onBookClick(book.id)}
        />
      ))}

      <button
        onClick={onAddBook}
        className="aspect-[3/4] flex flex-col items-center justify-center gap-4
                 border-2 border-dashed border-gray-700 rounded-lg
                 hover:border-primary hover:text-primary transition-colors"
      >
        <PlusIcon className="w-12 h-12" />
        <span className="font-medium">Add Book</span>
      </button>
    </div>
  )
}
