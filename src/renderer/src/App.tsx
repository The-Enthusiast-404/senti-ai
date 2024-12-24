import { useState } from 'react'
import MainLayout from './components/Layout/MainLayout'
import BookGrid from './components/Library/BookGrid'
import ViewToggle from './components/Library/ViewToggle'

function App(): JSX.Element {
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const mockBooks = [
    {
      id: '1',
      title: 'Sample PDF Book',
      lastOpened: new Date('2024-03-20')
    }
  ]

  const handleBookClick = (id: string): void => {
    console.log('Open book:', id)
  }

  const handleAddBook = (): void => {
    console.log('Add new book')
  }

  return (
    <MainLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Library</h2>
          <p className="text-gray-400">Select a book to read or add a new one</p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      <BookGrid
        books={mockBooks}
        view={view}
        onBookClick={handleBookClick}
        onAddBook={handleAddBook}
      />
    </MainLayout>
  )
}

export default App
