import { GitStatus, CommitMessage } from './types.js';
import fetch from 'node-fetch';

const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';

export async function generateCommitMessage(status: GitStatus): Promise<CommitMessage> {
  try {
    console.log('Connecting to Ollama API...');
    
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

    console.log('Sending request to Ollama...');
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      }),
    }).catch(error => {
      console.error('Network error details:', error);
      throw error;
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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

    // Helper function to format a message
    const formatMessage = (msg: string, defaultType: string = 'chore'): string => {
      msg = msg.replace(/^\s*[-:]\s*/, '').trim();
      
      // Remove any backticks
      msg = msg.replace(/`/g, '');
      
      // Remove any nested semantic types
      msg = msg.replace(/^.*?:\s*['"]?(feat|fix|docs|style|refactor|perf|test|chore):\s*/i, '');
      
      const semanticPattern = /^(feat|fix|docs|style|refactor|perf|test|chore)(\([^)]+\))?: .+$/;
      if (semanticPattern.test(msg)) {
        return msg;
      }

      // If not in correct format, try to extract type and description
      const words = msg.split(/\s+/);
      const type = words[0]?.toLowerCase();
      const description = words.slice(1).join(' ');
      
      // If we can identify a valid type, format it correctly
      if (['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'].includes(type)) {
        return `${type}: ${description}`;
      }
      
      // Clean up any remaining semantic prefixes in the description
      const cleanDescription = description.replace(/(feat|fix|docs|style|refactor|perf|test|chore):\s*/g, '');
      
      // Use the default type with cleaned description
      return `${defaultType}: ${cleanDescription || msg}`;
    };

    // Parse the numbered messages
    let messages: string[] = fullMessage
      .split(/\d\)/)
      .map(msg => msg.trim())
      .filter(msg => msg.length > 0)
      .map(msg => formatMessage(msg));

    // If no valid messages were generated, provide a default one
    if (messages.length === 0) {
      messages.push("chore: update files");
    }

    // Get the type from the first message
    const typeMatch = messages[0].match(/^([^(:]+)/);
    const firstType = typeMatch ? typeMatch[1] : 'chore';

    // Ensure all messages use the same type and we have exactly 3
    messages = messages
      .map(msg => {
        const content = msg.replace(/^[^:]+:\s*/, '');
        return `${firstType}: ${content}`;
      })
      .slice(0, 3);

    // If we have fewer than 3 messages, duplicate the first one
    while (messages.length < 3) {
      messages.push(messages[0] || `${firstType}: update files`);
    }

    return { messages };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Full error details:', error);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\nError: Could not connect to Ollama. Please make sure Ollama is running on http://127.0.0.1:11434');
        console.error('Install Ollama from: https://ollama.ai');
        console.error('\nTry these steps:');
        console.error('1. Open a new terminal');
        console.error('2. Run: ollama serve');
        console.error('3. Keep that terminal open and try this command again');
      } else {
        console.error('\nError generating commit message:', error.message);
      }
    }
    throw error;
  }
} 