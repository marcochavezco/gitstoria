import React, { useEffect, useState } from 'react';

interface Project {
  repo_path: string;
  commit_count: number;
  last_activity: string;
}

interface Props {
  selectedRepo: string | null;
  onSelectRepo: (repo: string) => void;
}

export default function Sidebar({ selectedRepo, onSelectRepo }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []));
  }, []);

  return (
    <div style={{ width: '220px', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a', color: '#555', fontSize: '10px', letterSpacing: '1px' }}>
        PROJECTS
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {projects.length === 0 && (
          <div style={{ padding: '16px 12px', color: '#444' }}>no projects yet</div>
        )}
        {projects.map((p) => (
          <div
            key={p.repo_path}
            onClick={() => onSelectRepo(p.repo_path)}
            style={{
              padding: '10px 12px',
              cursor: 'pointer',
              borderBottom: '1px solid #1a1a1a',
              backgroundColor: selectedRepo === p.repo_path ? '#151515' : 'transparent',
              color: selectedRepo === p.repo_path ? '#e0e0e0' : '#c0c0c0',
            }}
          >
            <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.repo_path.split('/').pop()}
            </div>
            <div style={{ color: '#444', fontSize: '10px', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.commit_count} log{p.commit_count !== 1 ? 's' : ''} · {p.repo_path}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
