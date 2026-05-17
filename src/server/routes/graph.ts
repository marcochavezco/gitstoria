import { Router, Request, Response } from 'express';
import { getOrInitDb } from '../../core/db.js';
import { getGitGraph, GraphNode } from '../../core/git.js';

export const graphRouter = Router();

graphRouter.get('/graph', (req: Request, res: Response) => {
  const repo = req.query.repo as string;
  if (!repo) {
    res.status(400).json({ error: 'repo query param required' });
    return;
  }

  let nodes: GraphNode[];
  try {
    nodes = getGitGraph(repo);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    return;
  }

  const db = getOrInitDb();
  const rows = db
    .prepare('SELECT commit_hash_start, commit_hash_end FROM session_logs WHERE repo_path = ?')
    .all(repo) as Array<{ commit_hash_start: string; commit_hash_end: string }>;

  const logged = new Set<string>();
  for (const row of rows) {
    logged.add(row.commit_hash_start);
    logged.add(row.commit_hash_end);
  }

  res.json({ nodes: nodes.map((n) => ({ ...n, hasLog: logged.has(n.hash) })) });
});
