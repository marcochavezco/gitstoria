#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execSync } from 'child_process';
import { getOrInitDb } from '../core/db.js';
import { getGitLog } from '../core/git.js';
let db;
async function main() {
    db = getOrInitDb();
    const server = new McpServer({ name: 'gitstoria', version: '1.0.0' });
    server.registerTool('get_git_diff', {
        description: 'Get the diff between two commits in a repository',
        inputSchema: {
            repoPath: z.string().describe('Absolute path to the git repository'),
            commitHashStart: z.string().describe('Starting commit hash'),
            commitHashEnd: z.string().describe('Ending commit hash'),
        },
    }, async ({ repoPath, commitHashStart, commitHashEnd }) => {
        try {
            const output = execSync(`git diff ${commitHashStart} ${commitHashEnd}`, {
                cwd: repoPath,
                encoding: 'utf8',
            });
            return {
                content: [{ type: 'text', text: output || 'No differences found.' }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error getting diff: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    server.registerTool('get_git_log', {
        description: 'Get the commit log for a repository',
        inputSchema: {
            repoPath: z.string().describe('Absolute path to the git repository'),
            limit: z
                .number()
                .optional()
                .describe('Max number of commits to return (default 10)'),
        },
    }, async ({ repoPath, limit }) => {
        try {
            const commits = getGitLog(repoPath, limit);
            return {
                content: [{ type: 'text', text: JSON.stringify(commits, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error getting git log: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    server.registerTool('log_session', {
        description: 'Save a session log for a range of commits',
        inputSchema: {
            repoPath: z.string().describe('Absolute path to the git repository'),
            commitHashStart: z
                .string()
                .describe('First commit hash in the session'),
            commitHashEnd: z.string().describe('Last commit hash in the session'),
            summary: z.string().describe('Claude summary of the session'),
        },
    }, async ({ repoPath, commitHashStart, commitHashEnd, summary }) => {
        try {
            db.prepare(`INSERT INTO session_logs (repo_path, commit_hash_start, commit_hash_end, summary)
           VALUES (?, ?, ?, ?)`).run(repoPath, commitHashStart, commitHashEnd, summary);
            return { content: [{ type: 'text', text: 'Session log saved.' }] };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error logging session: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    server.registerTool('get_session', {
        description: 'Get the session log for a specific commit',
        inputSchema: {
            repoPath: z.string().describe('Absolute path to the git repository'),
            commitHash: z.string().describe('Commit hash to look up'),
        },
    }, async ({ repoPath, commitHash }) => {
        try {
            const row = db
                .prepare(`SELECT * FROM session_logs
             WHERE repo_path = ?
               AND (commit_hash_start = ? OR commit_hash_end = ?)
             ORDER BY created_at DESC
             LIMIT 1`)
                .get(repoPath, commitHash, commitHash);
            if (!row) {
                return {
                    content: [
                        { type: 'text', text: 'No session log found for this commit.' },
                    ],
                };
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(row, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error getting session: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    server.registerTool('check_pending', {
        description: 'Get pending commits that have no session log yet',
        inputSchema: {
            repoPath: z.string().describe('Absolute path to the git repository'),
        },
    }, async ({ repoPath }) => {
        try {
            const rows = db
                .prepare(`SELECT * FROM pending_commits
             WHERE repo_path = ?
               AND commit_hash NOT IN (
                 SELECT commit_hash_start FROM session_logs WHERE repo_path = ?
                 UNION
                 SELECT commit_hash_end FROM session_logs WHERE repo_path = ?
               )
             ORDER BY created_at ASC`)
                .all(repoPath, repoPath, repoPath);
            return {
                content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error checking pending commits: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
export async function startMcpServer() {
    await main();
}
if (process.argv[1]?.endsWith('mcp/index.js')) {
    startMcpServer().catch((err) => {
        process.stderr.write(`[gitstoria-mcp] fatal: ${err instanceof Error ? err.message : String(err)}\n`);
        process.exit(1);
    });
}
