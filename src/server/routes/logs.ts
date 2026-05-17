import { Router, Request, Response } from 'express';
import { getOrInitDb } from '../../core/db.js';

export const logsRouter = Router();

logsRouter.get('/logs', (req: Request, res: Response) => {
  const { repo, commit } = req.query as { repo: string; commit: string };
  if (!repo || !commit) {
    res.status(400).json({ error: 'repo and commit query params required' });
    return;
  }
  const db = getOrInitDb();
  const log = db
    .prepare(
      `SELECT * FROM session_logs
       WHERE repo_path = ?
         AND (commit_hash_start = ? OR commit_hash_end = ?)
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get(repo, commit, commit);
  res.json({ log: log ?? null });
});

logsRouter.get('/search', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    res.json({ results: [] });
    return;
  }
  const db = getOrInitDb();
  const results = db
    .prepare(
      `SELECT repo_path, commit_hash_start, commit_hash_end, summary, created_at
       FROM session_logs
       WHERE summary LIKE ?
       ORDER BY created_at DESC`,
    )
    .all(`%${q}%`);
  res.json({ results });
});
