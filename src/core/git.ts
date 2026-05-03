import { execSync } from 'child_process';

export interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export function getGitLog(repoPath: string, limit = 10): Commit[] {
  try {
    const separator = '|||';
    const format = `%H${separator}%an${separator}%aI${separator}%s`;
    const output = execSync(`git log -n ${limit} --format="${format}"`, {
      cwd: repoPath,
      encoding: 'utf8',
    }).trim();

    if (!output) return [];

    return output.split('\n').map((line) => {
      const [hash, author, date, message] = line.split(separator);
      return { hash, author, date, message };
    });
  } catch (error) {
    throw new Error(
      `Failed to get git log for ${repoPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function getCurrentDiff(repoPath: string, staged = false): string {
  try {
    const flag = staged ? '--cached' : '';
    return execSync(`git diff ${flag}`, { cwd: repoPath, encoding: 'utf8' });
  } catch (error) {
    throw new Error(
      `Failed to get current diff for ${repoPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
