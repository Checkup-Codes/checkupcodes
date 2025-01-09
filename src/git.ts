import simpleGit from 'simple-git';
import { GitStatus } from './types.js';

const git = simpleGit();

export async function getGitStatus(): Promise<GitStatus> {
  const status = await git.status();
  const files: { [key: string]: string } = {};

  // Get diff for staged files
  for (const file of status.staged) {
    const diff = await git.diff(['--cached', file]);
    files[file] = diff;
  }

  return {
    files,
    staged: status.staged,
    modified: status.modified,
    created: status.created,
    deleted: status.deleted
  };
}

export async function createCommit(message: string): Promise<void> {
  await git.commit(message);
} 