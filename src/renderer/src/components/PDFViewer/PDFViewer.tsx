import { useState, useEffect, useRef } from 'react'
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import * as pdfjsLib from 'pdfjs-dist'

// Import worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PDFViewerProps {
  pdfPath: string
  onClose: () => void
}

interface Annotation {
  id: string
  pageNumber: number
  content: string
  position: { x: number; y: number }
  color: string
}

interface Highlight {
  id: string
  pageNumber: number
  content: string
  position: { x: number; y: number; width: number; height: number }
  color: string
}

export default function PDFViewer({ pdfPath, onClose }: PDFViewerProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pageCanvas, setPageCanvas] = useState<HTMLCanvasElement | null>(null)
  const [outline, setOutline] = useState<pdfjsLib.PDFOutline[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePageChange = async (newPage: number) => {
    if (!pdfDocument || newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    await renderPage(pdfDocument, newPage)
  }

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const buffer = await window.electron.ipcRenderer.invoke('read-pdf', pdfPath)
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
        setPdfDocument(pdf)
        setTotalPages(pdf.numPages)

        // Load outline/bookmarks
        const outline = await pdf.getOutline()
        if (outline) {
          // Transform outline to include page numbers
          const outlineWithPages = await Promise.all(
            outline.map(async (item) => {
              if (item.dest) {
                try {
                  // Handle both string and array destinations
                  const dest =
                    typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest

                  // Get the reference to the page
                  const ref = dest[0]
                  if (ref) {
                    const pageIndex = await pdf.getPageIndex(ref)
                    return { ...item, pageNumber: pageIndex + 1 }
                  }
                } catch (error) {
                  console.warn('Could not resolve destination:', error)
                }
              }
              return item
            })
          )
          setOutline(outlineWithPages)
        }

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

      // Calculate scale based on container width
      const containerWidth = containerRef.current?.clientWidth ?? 800
      const viewport = page.getViewport({ scale: 1.0 })
      const scaleFactor = (containerWidth * 0.9) / viewport.width
      const scaledViewport = page.getViewport({ scale: scaleFactor * scale })

      canvas.height = scaledViewport.height
      canvas.width = scaledViewport.width

      await page.render({
        canvasContext: context!,
        viewport: scaledViewport
      }).promise

      setPageCanvas(canvas)
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }

  const handleZoomIn = () => {
    const newScale = scale + 0.25
    setScale(newScale)
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage)
    }
  }

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale - 0.25)
    setScale(newScale)
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage)
    }
  }

  const handleTextSelection = () => {
    if (!isSelecting) return

    const selection = window.getSelection()
    if (!selection || !selection.toString()) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    const highlight: Highlight = {
      id: Date.now().toString(),
      pageNumber: currentPage,
      content: selection.toString(),
      position: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      color: '#ffeb3b'
    }

    setHighlights((prev) => [...prev, highlight])
    selection.removeAllRanges()
  }

  const handleAddAnnotation = (event: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const annotation: Annotation = {
      id: Date.now().toString(),
      pageNumber: currentPage,
      content: 'New annotation',
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      },
      color: '#4caf50'
    }

    setAnnotations((prev) => [...prev, annotation])
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
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSelecting(!isSelecting)}
            className={`px-4 py-2 rounded-lg ${
              isSelecting ? 'bg-primary text-white' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Highlight Mode
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 p-4 overflow-auto bg-gray-800"
          onClick={handleAddAnnotation}
          onMouseUp={handleTextSelection}
        >
          <div className="flex justify-center">
            {pageCanvas && (
              <div className="relative">
                <img
                  src={pageCanvas.toDataURL()}
                  alt={`Page ${currentPage}`}
                  className="max-w-full shadow-lg"
                />

                {/* Render highlights */}
                {highlights
                  .filter((h) => h.pageNumber === currentPage)
                  .map((highlight) => (
                    <div
                      key={highlight.id}
                      style={{
                        position: 'absolute',
                        left: highlight.position.x,
                        top: highlight.position.y,
                        width: highlight.position.width,
                        height: highlight.position.height,
                        backgroundColor: highlight.color,
                        opacity: 0.3,
                        pointerEvents: 'none'
                      }}
                    />
                  ))}

                {/* Render annotations */}
                {annotations
                  .filter((a) => a.pageNumber === currentPage)
                  .map((annotation) => (
                    <div
                      key={annotation.id}
                      style={{
                        position: 'absolute',
                        left: annotation.position.x,
                        top: annotation.position.y
                      }}
                      className="w-4 h-4 rounded-full bg-green-500 cursor-pointer"
                      title={annotation.content}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <Sidebar
            outline={outline}
            onJumpToPage={(page) => handlePageChange(page)}
            annotations={annotations}
            highlights={highlights}
          />
        )}
      </div>
    </div>
  )
}
