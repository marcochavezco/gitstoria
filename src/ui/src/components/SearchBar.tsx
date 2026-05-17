import React, { useEffect, useRef, useState } from 'react';

interface SearchResult {
  repo_path: string;
  commit_hash_start: string;
  summary: string;
}

interface Props {
  onSelectResult: (repo: string, commit: string) => void;
}

export default function SearchBar({ onSelectResult }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          setResults(d.results ?? []);
          setOpen(true);
        });
    }, 250);
  }, [query]);

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="search logs..."
        style={{
          width: '100%',
          background: '#111',
          border: '1px solid #2a2a2a',
          color: '#c0c0c0',
          padding: '4px 8px',
          fontFamily: 'inherit',
          fontSize: '12px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#111',
          border: '1px solid #2a2a2a',
          borderTop: 'none',
          zIndex: 10,
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {results.slice(0, 10).map((r, i) => (
            <div
              key={i}
              onMouseDown={() => { onSelectResult(r.repo_path, r.commit_hash_start); setQuery(''); setOpen(false); }}
              style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}
            >
              <div style={{ color: '#555', fontSize: '10px' }}>{r.repo_path.split('/').pop()}</div>
              <div style={{ color: '#c0c0c0', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.summary.slice(0, 100)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
