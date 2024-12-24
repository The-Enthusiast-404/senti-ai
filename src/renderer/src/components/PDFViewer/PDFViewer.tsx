import { useState, useEffect } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import * as pdfjsLib from 'pdfjs-dist'

// Import worker from CDN to avoid build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PDFViewerProps {
  pdfPath: string
  onClose: () => void
}

export default function PDFViewer({ pdfPath, onClose }: PDFViewerProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageCanvas, setPageCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const buffer = await window.electron.ipcRenderer.invoke('read-pdf', pdfPath)
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
        setPdfDocument(pdf)
        setTotalPages(pdf.numPages)
        renderPage(pdf, 1)
      } catch (error) {
        console.error('Error loading PDF:', error)
      }
    }

    loadPDF()
  }, [pdfPath])

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const viewport = page.getViewport({ scale: 1.5 })

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise

      setPageCanvas(canvas)
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }

  const handleNextPage = async () => {
    if (currentPage < totalPages && pdfDocument) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      await renderPage(pdfDocument, nextPage)
    }
  }

  const handlePrevPage = async () => {
    if (currentPage > 1 && pdfDocument) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      await renderPage(pdfDocument, prevPage)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        </button>
      </div>
      <div className="flex-1 flex">
        <div className="flex-1 p-4 flex justify-center items-center bg-gray-800">
          {pageCanvas && (
            <div className="overflow-auto max-h-full">
              <img
                src={pageCanvas.toDataURL()}
                alt={`Page ${currentPage}`}
                className="max-w-full"
              />
            </div>
          )}
        </div>
        {sidebarOpen && <Sidebar />}
      </div>
    </div>
  )
}
