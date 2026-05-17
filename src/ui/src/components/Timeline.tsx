import React, { useEffect, useState } from 'react';

interface Commit {
  commit_hash_start: string;
  commit_hash_end: string;
  summary: string;
  created_at: string;
}

interface Props {
  repo: string | null;
  selectedCommit: string | null;
  onSelectCommit: (commit: string) => void;
}

export default function Timeline({ repo, selectedCommit, onSelectCommit }: Props) {
  const [commits, setCommits] = useState<Commit[]>([]);

  useEffect(() => {
    if (!repo) { setCommits([]); return; }
    fetch(`/api/commits?repo=${encodeURIComponent(repo)}`)
      .then((r) => r.json())
      .then((d) => setCommits(d.commits ?? []));
  }, [repo]);

  return (
    <div style={{ width: '280px', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a', color: '#555', fontSize: '10px', letterSpacing: '1px' }}>
        TIMELINE
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!repo && <div style={{ padding: '16px 12px', color: '#444' }}>select a project</div>}
        {repo && commits.length === 0 && <div style={{ padding: '16px 12px', color: '#444' }}>no logs yet</div>}
        {commits.map((c) => (
          <div
            key={c.commit_hash_start}
            onClick={() => onSelectCommit(c.commit_hash_start)}
            style={{
              padding: '10px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid #1a1a1a',
              backgroundColor: selectedCommit === c.commit_hash_start ? '#151515' : 'transparent',
            }}
          >
            <div style={{ color: '#555', fontSize: '10px', fontFamily: 'monospace' }}>
              {c.commit_hash_start.slice(0, 7)}..{c.commit_hash_end.slice(0, 7)}
            </div>
            <div style={{ color: '#c0c0c0', fontSize: '11px', marginTop: '4px' }}>
              {c.summary.slice(0, 120)}{c.summary.length > 120 ? '…' : ''}
            </div>
            <div style={{ color: '#444', fontSize: '10px', marginTop: '4px' }}>
              {new Date(c.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
