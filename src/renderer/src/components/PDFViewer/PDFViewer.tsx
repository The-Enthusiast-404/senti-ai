import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js'

// Set worker directly
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface PDFViewerProps {
  tabId: string
}

export default function PDFViewer({ tabId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pdfFile, setPdfFile] = useState<string | null>(null)

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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-400">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark-100">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">PDF Viewer</h2>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Open PDF
            <input type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {pdfFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex items-center gap-4">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="px-3 py-1 bg-gray-200 dark:bg-dark-100 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-900 dark:text-gray-100">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                className="px-3 py-1 bg-gray-200 dark:bg-dark-100 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Please select a PDF file to view
          </div>
        )}
      </div>
    </div>
  )
}
