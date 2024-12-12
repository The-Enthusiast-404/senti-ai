export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
}

export interface ModelResponse {
  models: OllamaModel[]
}
