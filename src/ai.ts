import { GitStatus, CommitMessage } from './types.js';
import fetch from 'node-fetch';

const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';

export async function generateCommitMessage(status: GitStatus): Promise<CommitMessage> {
  try {
    console.log('Connecting to Ollama API...');
    
    const filesInfo = Object.entries(status.files)
      .map(([file, content]) => `File: ${file}\nContent: ${content.substring(0, 500)}...`)
      .join('\n\n');

    const prompt = `Based on the following staged files, generate a concise and descriptive commit message following conventional commits format (e.g., feat:, fix:, docs:, etc.).
    
Staged files:
${filesInfo}

Generate a commit message that describes the changes in a clear and professional way.`;

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

    process.stdout.write('Generated commit message: ');
    
    let fullMessage = '';
    for await (const chunk of response.body) {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk);
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            fullMessage += json.response;
            process.stdout.write(json.response);
          }
        } catch (e) {
          // Ignore parsing errors for incomplete chunks
        }
      }
    }
    
    process.stdout.write('\n');

    return {
      message: fullMessage.trim() || "chore: update files"
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