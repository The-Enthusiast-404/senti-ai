# Senti AI

A powerful desktop application for interacting with local LLMs through Ollama, featuring a modern interface inspired by Google AI Studio.

## Overview

Senti AI is an open-source desktop application that brings the power of local Large Language Models to your computer. Built with Electron, React, and TypeScript, it provides a seamless and familiar interface for interacting with various LLM models through Ollama.

## Features

### Current

- Local LLM interaction through Ollama
- Chat interface similar to ChatGPT/Claude
- Multi-model support
- Conversation history
- Markdown support
- Code highlighting

### Planned

- Advanced prompt templates
- Context-aware responses
- File attachment support
- Custom model configuration
- Export/Import conversations
- UI generation (similar to v0.dev)
- Notebook-style interface (similar to NotebookLM)
- RAG (Retrieval-Augmented Generation) support
- Multiple conversation windows
- Plugins system

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **AI Integration**: Vercel AI SDK, Ollama
- **Backend**: Electron
- **State Management**: Redux/Zustand
- **Database**: SQLite
- **Testing**: Jest, React Testing Library

## Prerequisites

- Node.js 18+
- Ollama installed and running locally
- Git

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Roadmap

### Phase 1 - Core Features (Q2 2024)

- [ ] Basic chat interface with Vercel AI SDK
- [ ] Ollama integration
- [ ] Multiple model support
- [ ] Streaming responses
- [ ] Conversation history
- [ ] Settings panel
- [ ] Dark/Light mode

### Phase 2 - Advanced Features (Q3 2024)

- [ ] File attachments
- [ ] Custom prompts
- [ ] Context window management
- [ ] Export/Import functionality
- [ ] Advanced model settings
- [ ] Function calling support

### Phase 3 - Extended Capabilities (Q4 2024)

- [ ] UI generation features
- [ ] Notebook interface
- [ ] Plugin system
- [ ] RAG implementation
- [ ] Multi-window support

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Google AI Studio, ChatGPT, Claude, and Perplexity
- Built on top of the amazing [Ollama](https://ollama.ai/) project
