import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import PDFSidebar from './PDFSidebar'
import ModelSelector from '../ModelSelector/ModelSelector'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface PDFViewerProps {
  tabId: string
}

export default function PDFViewer({ tabId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pdfFile, setPdfFile] = useState<string | null>(null)
  const [chapterText, setChapterText] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentModel, setCurrentModel] = useState<string>('llama2')
  const [bookText, setBookText] = useState<string>('')
  const [selectedText, setSelectedText] = useState<string>('')

  const isChapterStart = (text: string): boolean => {
    const chapterPatterns = [/^chapter\s+\d+/i, /^\d+\.\s+[A-Z]/, /^[IVX]+\.\s+[A-Z]/]
    return chapterPatterns.some((pattern) => pattern.test(text.trim()))
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPdfFile(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onPageLoadSuccess = async (page: any) => {
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item: any) => item.str).join(' ')

    if (isChapterStart(text)) {
      setChapterText(text)
    } else {
      setChapterText((prev) => `${prev}\n\n${text}`)
    }
  }

  const loadChapterPages = async (startPage: number, pdf: any) => {
    let chapterText = ''
    let currentPage = startPage

    while (currentPage <= pdf.numPages) {
      const page = await pdf.getPage(currentPage)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')

      if (currentPage !== startPage && isChapterStart(pageText)) {
        break
      }

      chapterText += `\n\n${pageText}`
      currentPage++
    }

    setChapterText(chapterText.trim())
  }

  const loadAllPages = async (pdf: any) => {
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += `\n\n${pageText}`
    }
    setBookText(fullText.trim())
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    if (pdfFile) {
      const pdf = pdfjs.getDocument(pdfFile).promise
      pdf.then((doc) => {
        loadChapterPages(1, doc)
        loadAllPages(doc)
      })
    }
  }

  const changePage = async (newPage: number) => {
    setPageNumber(newPage)
    if (pdfFile) {
      const pdf = await pdfjs.getDocument(pdfFile).promise
      const page = await pdf.getPage(newPage)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')

      if (isChapterStart(pageText)) {
        await loadChapterPages(newPage, pdf)
      }
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
    }
  }

  return (
    <div className="flex h-full bg-white dark:bg-dark-400">
      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">PDF Viewer</h2>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Open PDF
              <input type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
            </label>
            <ModelSelector onModelSelect={setCurrentModel} currentModel={currentModel} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-center">
            {pdfFile ? (
              <div onMouseUp={handleTextSelection} className="pdf-container">
                <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-lg"
                    onLoadSuccess={onPageLoadSuccess}
                  />
                </Document>
                <div className="flex justify-center items-center space-x-4 mt-4">
                  <button
                    onClick={() => changePage(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-dark-300 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700 dark:text-gray-300">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() => changePage(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber >= numPages}
                    className="px-4 py-2 bg-gray-200 dark:bg-dark-300 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Please select a PDF file to view
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis Sidebar */}
      {isSidebarOpen && (
        <PDFSidebar
          pageText={chapterText}
          chapterText={chapterText}
          bookText={bookText}
          pageNumber={pageNumber}
          totalPages={numPages}
          isFileLoaded={!!pdfFile}
          currentModel={currentModel}
          selectedText={selectedText}
          onClearSelection={() => setSelectedText('')}
        />
      )}
    </div>
  )
}
