#!/usr/bin/env node

import { Command } from 'commander';
import { getStagedFiles, createCommit } from './git.js';
import { generateCommitMessage } from './ai.js';

const program = new Command();

program
  .name('checkupcodes')
  .description('AI-powered commit message generator')
  .version('1.0.0');

program
  .command('commit')
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
      
      // Display commit message options
      console.log('\nPlease choose a commit message by entering its number (1-3):');
      commitMessage.messages.forEach((msg, index) => {
        console.log(`${index + 1}) ${msg}`);
      });

      const shouldProceed = await new Promise<number | false>((resolve) => {
        process.stdout.write('\nEnter your choice (1-3) or any other key to cancel: ');
        process.stdin.once('data', (data) => {
          const choice = parseInt(data.toString().trim());
          if (choice >= 1 && choice <= 3) {
            resolve(choice);
          } else {
            resolve(false);
          }
        });
      });

      if (shouldProceed !== false) {
        const selectedMessage = commitMessage.messages[shouldProceed - 1];
        await createCommit(selectedMessage);
        console.log('Commit created successfully!');
        process.exit(0);
      } else {
        console.log('Commit cancelled.');
        process.exit(0);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'An unknown error occurred');
      process.exit(1);
    }
  });

program.parse(); 