import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Timeline from './components/Timeline.tsx';
import LogDetail from './components/LogDetail.tsx';
import SearchBar from './components/SearchBar.tsx';

export default function App() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        borderBottom: '1px solid #2a2a2a',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
      }}>
        <span style={{ color: '#e0e0e0', letterSpacing: '2px', fontSize: '11px', fontWeight: 'bold' }}>
          ✦ GITSTORIA
        </span>
        <SearchBar onSelectResult={(repo, commit) => {
          setSelectedRepo(repo);
          setSelectedCommit(commit);
        }} />
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          selectedRepo={selectedRepo}
          onSelectRepo={(repo) => { setSelectedRepo(repo); setSelectedCommit(null); }}
        />
        <Timeline
          repo={selectedRepo}
          selectedCommit={selectedCommit}
          onSelectCommit={setSelectedCommit}
        />
        <LogDetail repo={selectedRepo} commit={selectedCommit} />
      </div>
    </div>
  );
}
