import { type ChatRequest } from 'ai'

export async function chat(request: ChatRequest): Promise<Response> {
  const response = await window.electron.ipcRenderer.invoke('chat:completion', request.messages)
  return new Response(response)
}
