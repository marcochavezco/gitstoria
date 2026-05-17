import { Router } from 'express';
import { getOrInitDb } from '../../core/db.js';

export const projectsRouter = Router();

projectsRouter.get('/projects', (_req, res) => {
  const db = getOrInitDb();
  const projects = db
    .prepare(
      `SELECT repo_path,
              COUNT(*) AS commit_count,
              MAX(created_at) AS last_activity
       FROM session_logs
       GROUP BY repo_path
       ORDER BY last_activity DESC`,
    )
    .all();
  res.json({ projects });
});
