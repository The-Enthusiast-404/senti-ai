import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return <h1 className="text-3xl font-bold underline text-red-500">Hello World</h1>
}

export default App
