export interface ModelPrompts {
  commitMessage: string;
}

const deepseekPrompts: ModelPrompts = {
  commitMessage: `Generate 3 semantic commit messages for these changes:
{changes}

Rules:
- Use one of: feat/fix/docs/style/refactor/perf/test/chore
- Format: "type: description"
- Be specific, no generic messages

Respond with just 3 lines:
1) type: description
2) type: description
3) type: description`
};

const defaultPrompts: ModelPrompts = {
  commitMessage: `You are a specialized code review assistant. Analyze the following code changes and generate three semantic commit messages.

Changed Files:
{changes}

Instructions:
1. First, carefully analyze the code changes:
   - Look at the actual code modifications, not just file names
   - Consider the context of the changes
   - Identify patterns in the modifications
   - Determine if this is a feature, bug fix, refactor, etc.

2. Then, determine ONE of these semantic types that best matches the changes:
   - feat: New features or significant additions
   - fix: Bug fixes
   - docs: Documentation changes
   - style: Code formatting, missing semicolons, etc.
   - refactor: Code changes that neither fix bugs nor add features
   - perf: Performance improvements
   - test: Adding or modifying tests
   - chore: Build process, dependencies, or tooling changes

3. Finally, generate THREE commit messages that:
   - All use the SAME semantic type you chose
   - Follow format: type: description
   - Use present tense (e.g., "add" not "added")
   - Are concise (max 50 chars for description)
   - Start with lowercase
   - Don't end with period
   - Each highlight different aspects of the changes
   - Are specific to the code changes, not generic

IMPORTANT: Never return generic messages like "update files". Always be specific about what changed.

Format your response as:
1) type: description
2) type: description
3) type: description`
};

export function getPrompts(modelName: string): ModelPrompts {
  if (modelName.includes('deepseek')) {
    return deepseekPrompts;
  }
  return defaultPrompts;
} 