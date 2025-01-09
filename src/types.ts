export interface GitStatus {
  files: { [key: string]: string };
  staged: string[];
  modified: string[];
  created: string[];
  deleted: string[];
}

export interface CommitMessage {
  messages: string[];
} 