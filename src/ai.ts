import { GitStatus, CommitMessage } from './types.js';
import { getModelConfig, ModelConfig } from './config.js';
import { getPrompts } from './prompts.js';
import fetch from 'node-fetch';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
}

interface FileChange {
  type: 'add' | 'modify' | 'delete';
  path: string;
  extension: string;
  addedLines: number;
  removedLines: number;
  changes: string;
}

function analyzeChanges(status: GitStatus): {
  summary: string;
  stats: {
    totalFiles: number;
    addedFiles: number;
    modifiedFiles: number;
    deletedFiles: number;
    impactedExtensions: Set<string>;
  };
  changes: FileChange[];
} {
  const changes: FileChange[] = [];
  const stats = {
    totalFiles: 0,
    addedFiles: 0,
    modifiedFiles: 0,
    deletedFiles: 0,
    impactedExtensions: new Set<string>()
  };

  Object.entries(status.files).forEach(([file, content]) => {
    const diffLines = content.diff.split('\n');
    const removedLines = diffLines.filter(line => line.startsWith('-'));
    const addedLines = diffLines.filter(line => line.startsWith('+'));
    
    const extension = file.split('.').pop() || '';
    stats.impactedExtensions.add(extension);
    
    let type: 'add' | 'modify' | 'delete' = 'modify';
    if (removedLines.length === 0 && addedLines.length > 0) {
      type = 'add';
      stats.addedFiles++;
    } else if (removedLines.length > 0 && addedLines.length === 0) {
      type = 'delete';
      stats.deletedFiles++;
    } else {
      stats.modifiedFiles++;
    }

    changes.push({
      type,
      path: file,
      extension,
      addedLines: addedLines.length,
      removedLines: removedLines.length,
      changes: `${removedLines.map(line => line.substring(1)).join('\n')}\n${addedLines.map(line => line.substring(1)).join('\n')}`
    });
  });

  stats.totalFiles = changes.length;

  // Create a summary focusing on the most significant changes
  const summary = changes
    .sort((a, b) => (b.addedLines + b.removedLines) - (a.addedLines + a.removedLines))
    .map(change => {
      const impact = change.addedLines + change.removedLines;
      return `${change.type.toUpperCase()}: ${change.path} (${impact} lines changed)
${change.changes}`;
    })
    .join('\n\n');

  return { summary, stats, changes };
}

async function generateWithOllama(prompt: string, modelConfig: ModelConfig): Promise<string> {
  const isDeepseek = modelConfig.name.includes('deepseek');

  const response = await fetch(modelConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.name,
      prompt: prompt,
      stream: !isDeepseek, // Disable streaming for deepseek
      options: {
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (isDeepseek) {
    // For deepseek, handle non-streaming response
    const data = await response.json() as OllamaResponse;
    return data.response;
  } else {
    // For other models, handle streaming response
    if (!response.body) {
      throw new Error('No response body received');
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

    const { summary, stats } = analyzeChanges(status);
    
    console.group("Change Analysis");
    console.log(`Total Files: ${stats.totalFiles}`);
    console.log(`Added: ${stats.addedFiles}, Modified: ${stats.modifiedFiles}, Deleted: ${stats.deletedFiles}`);
    console.log(`File Types: ${Array.from(stats.impactedExtensions).join(', ')}`);
    console.groupEnd();

    const prompts = getPrompts(modelConfig.name);
    const prompt = prompts.commitMessage
      .replace('{changes}', summary)
      .replace('{stats}', JSON.stringify(stats, null, 2));

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