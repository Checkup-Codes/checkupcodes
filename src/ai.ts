import { GitStatus, CommitMessage } from './types.js';
import fetch from 'node-fetch';

const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';

export async function generateCommitMessage(status: GitStatus): Promise<CommitMessage> {
  try {
    console.log('Connecting to Ollama API...');
    
    const filesInfo = Object.entries(status.files)
      .map(([file, content]) => `File: ${file}\nContent: ${content.substring(0, 500)}...`)
      .join('\n\n');

    const prompt = `Based on the following staged files, generate THREE different commit messages following Semantic Commit Messages format. Use one of these types:

feat: A new feature
fix: A bug fix
docs: Documentation only changes
style: Changes that do not affect the meaning of the code (white-space, formatting, etc)
refactor: A code change that neither fixes a bug nor adds a feature
perf: A code change that improves performance
test: Adding missing tests or correcting existing tests
chore: Changes to the build process or auxiliary tools
    
Format should be: <type>(<optional scope>): <description>

Example good commit messages:
- feat(auth): add login with Google OAuth
- fix(api): handle null response from user service
- docs: update installation guide
- style: format code according to new eslint rules
- refactor(db): simplify query builder logic
- perf(images): optimize image loading
- test(auth): add unit tests for login flow
- chore: update dependencies

Staged files:
${filesInfo}

Generate THREE different semantic commit messages that precisely describe the changes in a professional way. The messages should be clear and follow the exact format above.
Number each message with 1), 2), and 3).
Make each message unique and focus on different aspects of the changes.`;

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

    // Parse the numbered messages
    const messages = fullMessage
      .split(/\d\)/)
      .map(msg => msg.trim())
      .filter(msg => msg.length > 0)
      .map(msg => msg.replace(/^\s*[-:]\s*/, '').trim());

    // If no valid messages were generated, provide a default one
    if (messages.length === 0) {
      messages.push("chore: update files");
    }

    // Ensure we have exactly 3 messages
    while (messages.length < 3) {
      messages.push(messages[0]); // Duplicate the first message if we don't have enough
    }

    return {
      messages: messages.slice(0, 3) // Return exactly 3 messages
    };
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