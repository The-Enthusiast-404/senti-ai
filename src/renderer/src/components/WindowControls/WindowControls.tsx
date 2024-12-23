import { useEffect, useState } from 'react'

export default function WindowControls() {
  const [platform] = useState(window.api.platform)
  const isMac = platform === 'darwin'

  const handleClose = () => window.api.window.close()
  const handleMinimize = () => window.api.window.minimize()
  const handleMaximize = () => window.api.window.maximize()

  if (isMac) return null

  return (
    <div className="flex items-center space-x-2 px-4 no-drag">
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"
      />
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors"
      />
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"
      />
    </div>
  )
}
