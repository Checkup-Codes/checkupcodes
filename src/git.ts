import simpleGit from 'simple-git';
import { GitStatus } from './types.js';

const git = simpleGit();

export async function getGitStatus(): Promise<GitStatus> {
  const status = await git.status();
  const files: { [key: string]: { diff: string, oldContent: string, newContent: string } } = {};

  // Get diff and content for staged files
  for (const file of status.staged) {
    // Get the diff between staged and HEAD
    const diff = await git.diff(['--cached', file]);
    
    // Get the content from HEAD (old version)
    let oldContent = '';
    try {
      oldContent = await git.show([`HEAD:${file}`]);
    } catch (error) {
      // File might be new, so HEAD version doesn't exist
      oldContent = '';
    }

    // Get the staged content (new version)
    const newContent = await git.show([`:${file}`]);

    files[file] = {
      diff,
      oldContent,
      newContent
    };
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