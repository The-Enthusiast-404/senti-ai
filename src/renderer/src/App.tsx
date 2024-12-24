import { useState } from 'react'
import MainLayout from './components/Layout/MainLayout'
import BookGrid from './components/Library/BookGrid'
import ViewToggle from './components/Library/ViewToggle'
import PDFViewer from './components/PDFViewer/PDFViewer'

interface Book {
  id: string
  title: string
  lastOpened: Date
  pdfPath: string
  thumbnail?: string
}

function App(): JSX.Element {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])

  const handleBookClick = (id: string): void => {
    const book = books.find((b) => b.id === id)
    if (book) {
      setSelectedPDF(book.pdfPath)
    }
  }

  const handleAddBook = async (): Promise<void> => {
    try {
      const result = await window.electron.ipcRenderer.invoke('select-pdf')
      if (result.canceled || !result.filePaths[0]) return

      const pdfPath = result.filePaths[0]
      const fileName = pdfPath.split(/[/\\]/).pop() || 'Untitled'

      const newBook: Book = {
        id: Date.now().toString(),
        title: fileName.replace('.pdf', ''),
        pdfPath,
        lastOpened: new Date()
      }

      setBooks((prevBooks) => [...prevBooks, newBook])
    } catch (error) {
      console.error('Error selecting PDF:', error)
    }
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

      <BookGrid books={books} view={view} onBookClick={handleBookClick} onAddBook={handleAddBook} />

      {selectedPDF && <PDFViewer pdfPath={selectedPDF} onClose={() => setSelectedPDF(null)} />}
    </MainLayout>
  )
}

export default App
