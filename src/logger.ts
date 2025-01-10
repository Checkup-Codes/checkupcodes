import { CommitMessage } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

export function logCommitMessage(message: CommitMessage) {
    console.log(`Commit message: ${message}`);
}

export function logCommitToFile(message: string): void {
    const logFile = 'checkupcodes.txt';
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}
