import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';

interface LogEntry {
  id: number;
  repo_path: string;
  commit_hash_start: string;
  commit_hash_end: string;
  summary: string;
  created_at: string;
}

interface Props {
  repo: string | null;
  commit: string | null;
}

export default function LogDetail({ repo, commit }: Props) {
  const [log, setLog] = useState<LogEntry | null>(null);
  const [raw, setRaw] = useState(false);

  useEffect(() => {
    if (!repo || !commit) { setLog(null); return; }
    fetch(`/api/logs?repo=${encodeURIComponent(repo)}&commit=${encodeURIComponent(commit)}`)
      .then((r) => r.json())
      .then((d) => setLog(d.log ?? null));
  }, [repo, commit]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #2a2a2a',
        color: '#555',
        fontSize: '10px',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>LOG</span>
        {log && (
          <button
            onClick={() => setRaw((r) => !r)}
            style={{
              cursor: 'pointer',
              padding: '2px 6px',
              border: '1px solid #2a2a2a',
              background: 'transparent',
              color: '#555',
              fontFamily: 'inherit',
              fontSize: '10px',
            }}
          >
            {raw ? 'rendered' : 'raw'}
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {!log && <div style={{ color: '#444' }}>select a commit</div>}
        {log && raw && (
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: '12px', lineHeight: '1.6' }}>
            {log.summary}
          </pre>
        )}
        {log && !raw && (
          <div className="md" style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <Markdown>{log.summary}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
