#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { initDb, getOrInitDb } from '../core/db.js';
import { installHook } from '../core/hooks.js';

const program = new Command();

program
  .name('gitstoria')
  .description('Git commit story logger')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize gitstoria in the current repository')
  .action(() => {
    const cwd = process.cwd();

    console.log('');
    console.log('  ✦ gitstoria');
    console.log('  ─────────────────────────────────────');

    try {
      process.stdout.write('  › Initializing database...          ');
      initDb();
      console.log('✓');

      process.stdout.write('  › Installing post-commit hook...     ');
      installHook(cwd);
      console.log('✓');

      console.log('');
      console.log('  Add this to your claude_desktop_config.json:');
      console.log('');
      console.log('  {');
      console.log('    "mcpServers": {');
      console.log('      "gitstoria": {');
      console.log('        "command": "npx",');
      console.log('        "args": ["-y", "gitstoria", "mcp"]');
      console.log('      }');
      console.log('    }');
      console.log('  }');
      console.log('');
      console.log('  ─────────────────────────────────────');
      console.log('  ✦ Ready. Claude will now log your commits.');
      console.log('');
    } catch (err) {
      console.error('');
      console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command('record-commit')
  .description('Record a pending commit (called by the post-commit hook)')
  .requiredOption('--hash <hash>', 'commit hash')
  .requiredOption('--repo <path>', 'repository path')
  .action((opts: { hash: string; repo: string }) => {
    const dbPath = join(homedir(), '.gitstoria', 'sessions.db');
    if (!existsSync(dbPath)) {
      process.stderr.write(
        `[gitstoria] warning: database not found at ${dbPath} — run "gitstoria init" first\n`,
      );
      process.exit(0);
    }

    try {
      const db = getOrInitDb();
      db.prepare(
        'INSERT INTO pending_commits (repo_path, commit_hash) VALUES (?, ?)',
      ).run(opts.repo, opts.hash);
    } catch (err) {
      process.stderr.write(
        `[gitstoria] error recording commit: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exit(1);
    }
  });

program
  .command('mcp')
  .description('Start the gitstoria MCP server')
  .action(async () => {
    const { startMcpServer } = await import('../mcp/index.js');
    await startMcpServer();
  });

program
  .command('ui')
  .description('Open the gitstoria UI in your browser')
  .option('--port <port>', 'starting port', '3000')
  .action(async (opts: { port: string }) => {
    try {
      const { startServer } = await import('../server/index.js');
      await startServer(parseInt(opts.port, 10));
    } catch (err) {
      console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program.parse();
