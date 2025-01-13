export interface ModelPrompts {
  commitMessage: string;
}

const deepseekPrompts: ModelPrompts = {
  commitMessage: `Generate 3 semantic commit messages for these changes:

Change Statistics:
{stats}

Detailed Changes:
{changes}

Rules:
- Use one of: feat/fix/docs/style/refactor/perf/test/chore
- Format: "type: description"
- Focus on the most impactful changes
- Group similar changes together
- Be specific, no generic messages

Respond with just 3 lines:
1) type: description
2) type: description
3) type: description`
};

const defaultPrompts: ModelPrompts = {
  commitMessage: `You are a specialized code review assistant. Analyze the following code changes and generate three semantic commit messages.

Change Statistics:
{stats}

Detailed Changes:
{changes}

Instructions:
1. First, analyze the change statistics and patterns:
   - Look at the number of files modified/added/deleted
   - Consider which file types were impacted
   - Identify the most significant changes by line count
   - Look for patterns in the changes

2. Then, determine ONE of these semantic types that best matches the primary changes:
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
   - Focus on the most significant changes
   - Group similar changes together
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