#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommitMessage } from './ai.js';
import { showConfig, setModel } from './commands.js';
import { getGitStatus, createCommit } from './git.js';
import { logCommitToFile } from './logger.js';
import { getAvailableModels } from './config.js';
import chalk from 'chalk';
import * as readline from 'readline';

const program = new Command();

program
  .name('checkupcodes')
  .description('AI-powered commit message generator')
  .version('1.0.0');

program
  .command('commit')
  .description('Generate and apply commit message for staged files')
  .option('-m, --model <name>', 'specify AI model to use')
  .action(async (options) => {
    try {
      const status = await getGitStatus();
      if (status.staged.length === 0) {
        console.error('No staged files found. Please stage some files first using `git add`');
        process.exit(1);
      }

      console.log('Analyzing staged files...\n');
      const commitMessage = await generateCommitMessage(status, options.model);

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
        let selectedMessage = commitMessage.messages[shouldProceed - 1];
        await logCommitToFile(selectedMessage);

        // Show edit option
        console.log('\nSelected commit message:');
        console.log(selectedMessage);

        const shouldEdit = await new Promise<boolean>((resolve) => {
          process.stdout.write('\nDo you want to edit this message? (y/N): ');
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim().toLowerCase() === 'y');
          });
        });

        if (shouldEdit) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          process.stdout.write('\nEdit commit message\n');
          process.stdout.write('Current message: ' + selectedMessage + '\n');
          process.stdout.write('(Enter your new message or press Enter to keep the current message)\n');

          selectedMessage = await new Promise<string>((resolve) => {
            rl.question('New message: ', (answer) => {
              rl.close();
              resolve(answer || selectedMessage); // Use original if empty
            });
          });
        }

        await createCommit(selectedMessage);
        console.log('Commit created successfully!');
        process.exit(0);
      } else {
        console.log('Commit cancelled.');
        process.exit(0);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate commit messages for staged changes')
  .option('-m, --model <name>', 'specify AI model to use')
  .action(async (options) => {
    try {
      const status = await getGitStatus();
      const result = await generateCommitMessage(status, options.model);

      console.log('\nGenerated commit messages:');
      result.messages.forEach((msg, i) => {
        console.log(`${i + 1}) ${msg}`);
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show current AI configuration')
  .action(() => {
    showConfig();
  });

program
  .command('set-model')
  .description('Set default AI model')
  .argument('<model>', 'model name to set as default')
  .action((model) => {
    setModel(model);
  });

program
  .command('models')
  .description('List all available AI models for commit message generation')
  .action(() => {
    const models = getAvailableModels();
    console.log('\nAvailable AI Models:');
    console.log('------------------');
    models.forEach(model => {
      const icon = model === 'openai' ? '🌐' : '🤖';
      console.log(`${icon} ${chalk.bold(model)}`);
    });
    console.log('\nUsage:');
    console.log('  Set default model:');
    console.log(`  ${chalk.cyan('cc set-model <model-name>')}`);
    console.log('\n  Use specific model for one commit:');
    console.log(`  ${chalk.cyan('cc commit -m <model-name>')}`);
  });

program.parse(); 