import { ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col">
      <header className="border-b border-gray-800 p-4 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <h1 className="text-2xl font-bold">PagePal</h1>
      </header>
      <main className="flex-1 p-6 w-full max-w-[2000px] mx-auto">{children}</main>
    </div>
  )
}
