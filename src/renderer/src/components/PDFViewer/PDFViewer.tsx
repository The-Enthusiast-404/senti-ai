import { useState, useEffect, useRef } from 'react'
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ListBulletIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import * as pdfjsLib from 'pdfjs-dist'
import AISidebar from './AISidebar'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [currentPageText, setCurrentPageText] = useState<string>('')
  const [currentChapter, setCurrentChapter] = useState<{
    title: string
    startPage: number
    endPage: number
  } | null>(null)

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

  useEffect(() => {
    const updateChapterInfo = async () => {
      const chapterInfo = await window.electron.ipcRenderer.invoke('get-chapter-info', currentPage)
      setCurrentChapter(chapterInfo)
    }
    updateChapterInfo()
  }, [currentPage])

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber)
      const containerWidth = containerRef.current?.clientWidth ?? 800
      const viewport = page.getViewport({ scale: 1.0 })
      const scaleFactor = (containerWidth * 0.9) / viewport.width
      const scaledViewport = page.getViewport({ scale: scaleFactor * scale })

      // Canvas Layer
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = scaledViewport.height
      canvas.width = scaledViewport.width

      // Create a wrapper div
      const wrapper = document.createElement('div')
      wrapper.className = 'relative'
      wrapper.style.height = `${scaledViewport.height}px`
      wrapper.style.width = `${scaledViewport.width}px`
      wrapper.appendChild(canvas)

      // Create text layer div
      const textLayerDiv = document.createElement('div')
      textLayerDiv.className = 'absolute top-0 left-0 text-layer'
      textLayerDiv.style.width = `${scaledViewport.width}px`
      textLayerDiv.style.height = `${scaledViewport.height}px`
      wrapper.appendChild(textLayerDiv)

      // Render canvas layer
      await page.render({
        canvasContext: context!,
        viewport: scaledViewport
      }).promise

      // Get text content and store it
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      setCurrentPageText(pageText)

      // Get text content and render text layer
      pdfjsLib.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport: scaledViewport,
        textDivs: []
      })

      setPageCanvas(wrapper)
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

  const handleClose = async () => {
    await window.electron.ipcRenderer.invoke('clear-document-context')
    onClose()
  }

  useEffect(() => {
    const processOutlineChapters = async () => {
      for (const item of outline) {
        if (item.pageNumber && item.title) {
          // Find the next chapter to determine end page
          const currentIndex = outline.indexOf(item)
          const nextChapter = outline[currentIndex + 1]
          const endPage = nextChapter?.pageNumber
            ? nextChapter.pageNumber - 1
            : item.pageNumber + 10 // Default chapter length if no next chapter

          await window.electron.ipcRenderer.invoke('process-chapter', {
            title: item.title,
            startPage: item.pageNumber,
            endPage: endPage
          })
        }
      }
    }

    if (outline.length > 0) {
      processOutlineChapters()
    }
  }, [outline])

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
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
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
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
        <div ref={containerRef} className="flex-1 p-4 overflow-auto bg-gray-800">
          <div className="flex justify-center">
            {pageCanvas && (
              <div className="relative">
                <div
                  ref={(element) => {
                    if (element && pageCanvas) {
                      element.innerHTML = ''
                      element.appendChild(pageCanvas)
                    }
                  }}
                  className="relative"
                />

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

        {aiSidebarOpen && (
          <AISidebar
            currentPage={currentPage}
            pageContent={currentPageText}
            currentChapter={currentChapter}
          />
        )}
        {sidebarOpen && (
          <Sidebar
            outline={outline}
            onJumpToPage={(page) => handlePageChange(page)}
            annotations={annotations}
          />
        )}
      </div>
    </div>
  )
}
