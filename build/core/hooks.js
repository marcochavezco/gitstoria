import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
const HOOK_SCRIPT = `#!/bin/sh
HASH=$(git rev-parse HEAD)
REPO=$(pwd)
gitstoria record-commit --hash "$HASH" --repo "$REPO"
`;
export function installHook(repoPath) {
    const gitDir = join(repoPath, '.git');
    if (!existsSync(gitDir)) {
        throw new Error(`Not a git repository: ${repoPath}`);
    }
    const hooksDir = join(gitDir, 'hooks');
    if (!existsSync(hooksDir)) {
        mkdirSync(hooksDir, { recursive: true });
    }
    const hookPath = join(hooksDir, 'post-commit');
    if (existsSync(hookPath)) {
        throw new Error(`A post-commit hook already exists at ${hookPath}. ` +
            `Add this line manually: gitstoria record-commit --hash "$(git rev-parse HEAD)" --repo "$(pwd)"`);
    }
    writeFileSync(hookPath, HOOK_SCRIPT, { encoding: 'utf8' });
    chmodSync(hookPath, '755');
}
