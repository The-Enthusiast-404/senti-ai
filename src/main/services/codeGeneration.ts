import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { CODE_GENERATION_PROMPT } from '../templates/componentTemplates'

interface GeneratedCode {
  code: string
  language: string
  componentName: string
}

export class CodeGenerationService {
  private model: ChatOllama

  constructor() {
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: 'codellama:13b'
    })
  }

  async generateComponent(prompt: string): Promise<GeneratedCode> {
    const systemPrompt = CODE_GENERATION_PROMPT.replace('{{PROMPT}}', prompt)
    const chain = RunnableSequence.from([this.model, new StringOutputParser()])
    const response = await chain.invoke(systemPrompt)

    const componentNameMatch = response.match(/function\s+(\w+)/)
    const componentName = componentNameMatch ? componentNameMatch[1] : 'GeneratedComponent'

    return {
      code: response,
      language: 'typescript',
      componentName
    }
  }
}
