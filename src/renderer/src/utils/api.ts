import { type ChatRequest as BaseChatRequest } from 'ai'

interface ChatRequest extends BaseChatRequest {
  body: {
    model: string
  }
}

export async function chat(request: ChatRequest): Promise<Response> {
  const response = await window.electron.ipcRenderer.invoke('chat:completion', {
    messages: request.messages,
    model: request.body.model || 'llama2'
  })

  // Create a ReadableStream that returns the response
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(response)
      controller.close()
    }
  })

  return new Response(stream)
}
