export interface GitStatus {
  staged: string[];
  files: { [key: string]: string };
}

export interface CommitMessage {
  messages: string[];
} 