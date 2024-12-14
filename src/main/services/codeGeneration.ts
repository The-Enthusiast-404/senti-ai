import { ChatOllama } from '@langchain/community/chat_models/ollama'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'

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
    const systemPrompt = `You are a React TypeScript component generator. Generate a single, complete component based on the user's requirements.

Requirements:
- Use TypeScript with proper interfaces
- Use functional components with React hooks
- Include JSDoc comments
- Use CSS for styling with a <style> tag in the component
- Follow React best practices
- Ensure responsive design using media queries
- Keep code clean and maintainable
- Add proper aria-labels and accessibility attributes
- Use modern React patterns
- Include proper type definitions
- IMPORTANT: Always provide complete, working code
- IMPORTANT: Include all necessary imports
- IMPORTANT: Include complete type definitions
- IMPORTANT: Include complete function implementations
- IMPORTANT: Only use standard HTML elements (no custom components)
- IMPORTANT: Don't reference external components or libraries except React
- IMPORTANT: Include CSS styles within a <style> tag in the component's return statement

Example CSS implementation:
return (
  <>
    <style>
      {
        \`
        .component-class {
          styles here
        }
        \`
      }
    </style>
    <div>Component content</div>
  </>
);

Component Request: ${prompt}

Output only the complete TypeScript React code without any explanations or markdown.`

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
