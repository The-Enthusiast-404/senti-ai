import { useEffect } from 'react'
import { useThemeStore } from '../../stores/themeStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    // Apply to both html and body for complete coverage
    const root = document.documentElement
    const body = document.body

    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }
  }, [theme])

  return <div className={`${theme} h-full w-full`}>{children}</div>
}
