export interface GitFileContent {
    diff: string;
    oldContent: string;
    newContent: string;
}

export interface GitStatus {
    files: { [key: string]: GitFileContent };
    staged: string[];
    modified: string[];
    created: string[];
    deleted: string[];
}

export interface CommitMessage {
  messages: string[];
} 