import { GitStatus, CommitMessage } from './types.js';
import { getModelConfig, ModelConfig } from './config.js';
import fetch from 'node-fetch';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function generateWithOllama(prompt: string, modelConfig: ModelConfig): Promise<string> {
  const response = await fetch(modelConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.name,
      prompt: prompt,
      stream: true,
      options: {
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP
      }
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  let fullMessage = '';
  for await (const chunk of response.body) {
    const text = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk);
    const lines = text.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.response) {
          fullMessage += json.response;
        }
      } catch (e) {
        // Ignore parsing errors for incomplete chunks
      }
    }
  }
  return fullMessage;
}

async function generateWithOpenAI(prompt: string, modelConfig: ModelConfig): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found in environment variables');
  }

  const response = await fetch(modelConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error! status: ${response.status}`);
  }

  const data = await response.json() as OpenAIResponse;
  return data.choices[0].message.content;
}

export async function generateCommitMessage(status: GitStatus, modelName?: string): Promise<CommitMessage> {
  try {
    const modelConfig = getModelConfig(modelName);
    console.log(`Connecting to ${modelConfig.name} API...`);
    
    const filesInfo = Object.entries(status.files)
      .map(([file, content]) => {
        const lines = content.split('\n');
        const addedLines = lines
          .filter(line => line.startsWith('+'))
          .map(line => line.substring(1))
          .join('\n');
        const removedLines = lines
          .filter(line => line.startsWith('-'))
          .map(line => line.substring(1))
          .join('\n');
        
        return `File: ${file}
${removedLines ? `Lines Removed:\n${removedLines}` : 'No lines removed'}
${addedLines ? `\nLines Added:\n${addedLines}` : '\nNo lines added'}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Analyze the following code changes and generate three semantic commit messages.

Changed Files:
${filesInfo}

Instructions:
1. First, determine ONE of these semantic types that best matches the changes:
   - feat: New features or significant additions
   - fix: Bug fixes
   - docs: Documentation changes
   - style: Code formatting, missing semicolons, etc.
   - refactor: Code changes that neither fix bugs nor add features
   - perf: Performance improvements
   - test: Adding or modifying tests
   - chore: Build process, dependencies, or tooling changes

2. Then generate THREE commit messages that:
   - All use the SAME semantic type you chose
   - Follow format: type: description
   - Use present tense (e.g., "add" not "added")
   - Are concise (max 50 chars for description)
   - Start with lowercase
   - Don't end with period
   - Each highlight different aspects of the changes

Format your response as:
1) type: description
2) type: description
3) type: description`;

    console.log(`Sending request to ${modelConfig.name}...`);
    
    let fullMessage: string;
    if (modelConfig.name === 'openai') {
      fullMessage = await generateWithOpenAI(prompt, modelConfig);
    } else {
      fullMessage = await generateWithOllama(prompt, modelConfig);
    }

    // Helper function to format a message
    const formatMessage = (msg: string, defaultType: string = 'chore'): string => {
      msg = msg.replace(/^\s*[-:]\s*/, '').trim();
      msg = msg.replace(/`/g, '');
      msg = msg.replace(/^.*?:\s*['"]?(feat|fix|docs|style|refactor|perf|test|chore):\s*/i, '');
      
      const semanticPattern = /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]+\))?: .+$/;
      if (semanticPattern.test(msg)) {
        return msg;
      }

      const words = msg.split(/\s+/);
      const type = words[0]?.toLowerCase();
      const description = words.slice(1).join(' ');
      
      if (['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'].includes(type)) {
        return `${type}: ${description}`;
      }
      
      const cleanDescription = description.replace(/(feat|fix|docs|style|refactor|perf|test|chore):\s*/g, '');
      return `${defaultType}: ${cleanDescription || msg}`;
    };

    let messages: string[] = fullMessage
      .split(/\d\)/)
      .map(msg => msg.trim())
      .filter(msg => msg.length > 0)
      .map(msg => formatMessage(msg));

    if (messages.length === 0) {
      messages.push("chore: update files");
    }

    const typeMatch = messages[0].match(/^([^(:]+)/);
    const firstType = typeMatch ? typeMatch[1] : 'chore';

    messages = messages
      .map(msg => {
        const content = msg.replace(/^[^:]+:\s*/, '');
        return `${firstType}: ${content}`;
      })
      .slice(0, 3);

    while (messages.length < 3) {
      messages.push(messages[0] || `${firstType}: update files`);
    }

    return { messages };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Full error details:', error);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\nError: Could not connect to AI service. Please check your configuration and ensure the service is running.');
        if (error.message.includes('11434')) {
          console.error('For Ollama models:');
          console.error('1. Install Ollama from: https://ollama.ai');
          console.error('2. Open a new terminal');
          console.error('3. Run: ollama serve');
          console.error('4. Keep that terminal open and try this command again');
        }
      } else {
        console.error('\nError generating commit message:', error.message);
      }
    }
    throw error;
  }
} 