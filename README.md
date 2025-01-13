# checkupcodes

An AI-powered commit message generator CLI tool that analyzes files in the git staging area and suggests appropriate commit messages using advanced AI models (Mistral and Deepseek).

## Features

- 🤖 AI-powered commit message generation using Mistral and Deepseek models
- 📝 Analyzes staged files in your git repository
- 🚀 Easy to use CLI interface
- ⚡ Quick and efficient processing
- 🔄 Interactive commit confirmation
- 🎯 Local AI model support

## Installation

```bash
npm install -g checkupcodes
```

## Prerequisites

- Node.js (v14 or higher)
- Git installed on your system
- Ollama installed with Mistral and Deepseek models

## Setup

1. Install Ollama and download the required models:
```bash
# First install Ollama for your operating system
# Then run these commands to pull the models:
ollama pull mistral
ollama pull deepseek
```

2. Make sure you have staged your files in git:
```bash
git add .
```

## Usage

The CLI tool supports several commands:

### Generate Commit Message
```bash
checkupcodes codes
# or
cc codes
```

### Configure Settings
```bash
checkupcodes config
# or
cc config
```

### Set AI Model
```bash
checkupcodes set-model
# or
cc set-model
```

### Available Commands
| Command | Description |
|---------|-------------|
| `codes` | Analyzes staged files and generates a commit message |
| `config` | View or modify configuration settings |
| `set-model` | Change the AI model (choose between Mistral and Deepseek) |

The tool will:
- Analyze the files in your git staging area
- Generate an appropriate commit message using the selected AI model
- Present you with the option to confirm or modify the commit

## Development

1. Clone the repository:
```bash
git clone https://github.com/Checkup-Codes/checkupcodes.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file and add your OpenAI API key

4. Build the project:
```bash
npm run build
```

5. For local development and testing:
```bash
npm link
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please file an issue at [GitHub Issues](https://github.com/Checkup-Codes/checkupcodes/issues). 

## Version History

### v0.0.5
- 🔄 Enhanced AI response handling
  - Improved streaming response handling for different AI models
  - Better error handling with user-friendly messages
  - Added support for both streaming and non-streaming responses
- 📊 Enhanced change analysis system
  - More detailed file change statistics
  - Better summary generation for complex changes
  - Improved semantic commit message formatting
- 🛠️ Technical improvements
  - Added TypeScript type safety improvements
  - Better error messages for configuration issues
  - Enhanced API connection handling

### v0.0.4
- 🎯 Added new `models` command to list available AI models
  - Shows all supported AI models with visual indicators
  - Displays usage examples for model selection
  - Easy model switching guide
- 🔧 Improved deepseek-coder integration
  - Optimized prompt handling for better responses
  - Enhanced API communication
  - Streamlined model responses
- 🚀 Performance improvements
  - Reduced prompt size for better model compatibility
  - Optimized response handling for different model types

### v0.0.3
- ✨ Enhanced commit analysis with detailed file comparison
  - Added complete diff view between staged and HEAD versions
  - Added full file content comparison for better context
  - Improved AI prompt with detailed file changes
- 📝 Added automatic commit logging to `checkupcodes.txt`
  - Logs selected commit messages before any edits
  - File is automatically ignored by git

### v0.0.2
- 🚀 Initial public release
- 🤖 Basic AI-powered commit message generation
- 📝 Support for Mistral and Deepseek models
- ⚡ Interactive commit selection and editing 