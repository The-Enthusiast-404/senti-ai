import { ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold">PagePal</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
