import { Router, Request, Response } from 'express';
import { getOrInitDb } from '../../core/db.js';

export const commitsRouter = Router();

commitsRouter.get('/commits', (req: Request, res: Response) => {
  const repo = req.query.repo as string;
  if (!repo) {
    res.status(400).json({ error: 'repo query param required' });
    return;
  }
  const db = getOrInitDb();
  const commits = db
    .prepare(
      `SELECT commit_hash_start, commit_hash_end, summary, created_at
       FROM session_logs
       WHERE repo_path = ?
       ORDER BY created_at DESC`,
    )
    .all(repo);
  res.json({ commits });
});
