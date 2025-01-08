import simpleGit from 'simple-git';
import { GitStatus } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const git = simpleGit();

export async function getStagedFiles(): Promise<GitStatus> {
  const status = await git.status();
  const staged = status.staged;
  const files: { [key: string]: string } = {};

  for (const file of staged) {
    try {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
      files[file] = content;
    } catch (error) {
      console.warn(`Could not read file: ${file}`);
    }
  }

  return {
    staged,
    files
  };
}

export async function createCommit(message: string): Promise<void> {
  await git.commit(message);
} 