#!/usr/bin/env node

import { Command } from 'commander';
import { getStagedFiles, createCommit } from './git.js';
import { generateCommitMessage } from './ai.js';

const program = new Command();

program
  .name('checkup')
  .description('AI-powered commit message generator')
  .version('1.0.0');

program
  .command('codes')
  .description('Generate commit message for staged files')
  .action(async () => {
    try {
      const status = await getStagedFiles();
      
      if (status.staged.length === 0) {
        console.error('No staged files found. Please stage some files first using `git add`');
        process.exit(1);
      }

      console.log('Analyzing staged files...\n');
      const commitMessage = await generateCommitMessage(status);
      
      const shouldProceed = await new Promise<boolean>((resolve) => {
        process.stdout.write('\nDo you want to create this commit? (y/N): ');
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim().toLowerCase() === 'y');
        });
      });

      if (shouldProceed) {
        await createCommit(commitMessage.message);
        console.log('Commit created successfully!');
      } else {
        console.log('Commit cancelled.');
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'An unknown error occurred');
      process.exit(1);
    }
  });

program.parse(); 