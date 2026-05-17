import React, { useEffect, useState } from 'react';

const ROW_HEIGHT = 28;
const LANE_WIDTH = 20;
const NODE_RADIUS = 5;
const PAD_LEFT = 10;
const NEON = ['#00ff41', '#00ffff', '#ff00ff', '#ff9500', '#ffff00', '#ff0080', '#a855f7'];

interface GraphNode {
  hash: string;
  parents: string[];
  refs: string[];
  subject: string;
  author: string;
  date: string;
  hasLog: boolean;
}

interface Positioned extends GraphNode {
  col: number;
  x: number;
  y: number;
}

interface Props {
  repo: string | null;
  selectedCommit: string | null;
  onSelectCommit: (hash: string) => void;
}

function assignLanes(nodes: GraphNode[]): Positioned[] {
  const lanes: Array<string | null> = [];
  return nodes.map((commit, i) => {
    let col = lanes.indexOf(commit.hash);
    if (col === -1) {
      const free = lanes.indexOf(null);
      col = free !== -1 ? free : lanes.length;
      if (col === lanes.length) lanes.push(null);
    }
    lanes[col] = commit.parents[0] ?? null;

    // Free any other lanes that were also waiting for this commit (branch converged)
    for (let li = 0; li < lanes.length; li++) {
      if (li !== col && lanes[li] === commit.hash) lanes[li] = null;
    }

    // Allocate lanes for additional parents (merge commits)
    for (const p of commit.parents.slice(1)) {
      if (lanes.indexOf(p) === -1) {
        const free = lanes.indexOf(null);
        const pl = free !== -1 ? free : lanes.length;
        if (pl === lanes.length) lanes.push(null);
        lanes[pl] = p;
      }
    }
    return {
      ...commit,
      col,
      x: PAD_LEFT + col * LANE_WIDTH,
      y: i * ROW_HEIGHT + ROW_HEIGHT / 2,
    };
  });
}

export default function GitGraph({ repo, selectedCommit, onSelectCommit }: Props) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) { setNodes([]); setError(null); return; }
    setError(null);
    fetch(`/api/graph?repo=${encodeURIComponent(repo)}`)
      .then((r) => r.ok ? r.json() : r.json().then((d: { error?: string }) => Promise.reject(d.error ?? 'fetch failed')))
      .then((d: { nodes: GraphNode[] }) => setNodes(d.nodes ?? []))
      .catch((e: unknown) => setError(typeof e === 'string' ? e : String(e)));
  }, [repo]);

  const positioned = assignLanes(nodes);
  const maxCol = positioned.reduce((m, n) => Math.max(m, n.col), 0);
  const refAreaX = PAD_LEFT + (maxCol + 1) * LANE_WIDTH + 6;
  const svgWidth = refAreaX + 220;
  const svgHeight = Math.max(positioned.length * ROW_HEIGHT, 1);
  const posMap = new Map(positioned.map((n) => [n.hash, n]));

  return (
    <div style={{
      width: '340px',
      borderRight: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #2a2a2a',
        color: '#555',
        fontSize: '10px',
        letterSpacing: '1px',
        flexShrink: 0,
      }}>
        GIT GRAPH
      </div>

      {!repo && <div style={{ padding: '16px 12px', color: '#444' }}>select a project</div>}
      {repo && error && <div style={{ padding: '16px 12px', color: '#ff4444', fontSize: '11px' }}>{error}</div>}
      {repo && !error && positioned.length === 0 && <div style={{ padding: '16px 12px', color: '#444' }}>no commits</div>}

      {repo && !error && positioned.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
            {/* edges */}
            <g>
              {positioned.map((commit) =>
                commit.parents.map((parentHash) => {
                  const parent = posMap.get(parentHash);
                  if (!parent) return null;
                  const color = NEON[commit.col % 7];
                  const key = `e-${commit.hash.slice(0, 7)}-${parentHash.slice(0, 7)}`;
                  if (commit.col === parent.col) {
                    return (
                      <line key={key}
                        x1={commit.x} y1={commit.y} x2={parent.x} y2={parent.y}
                        stroke={color} strokeOpacity={0.5} strokeWidth={1.5}
                      />
                    );
                  }
                  const midY = (commit.y + parent.y) / 2;
                  return (
                    <path key={key}
                      d={`M ${commit.x} ${commit.y} C ${commit.x} ${midY} ${parent.x} ${midY} ${parent.x} ${parent.y}`}
                      fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={1.5}
                    />
                  );
                })
              )}
            </g>

            {/* nodes */}
            <g>
              {positioned.map((commit) => {
                const color = NEON[commit.col % 7];
                const isSelected = commit.hash === selectedCommit;
                const isHovered = hoveredHash === commit.hash;
                const glow = (isSelected || isHovered) && commit.hasLog
                  ? `drop-shadow(0 0 ${isSelected ? 6 : 4}px ${color})`
                  : undefined;
                const r = isSelected ? NODE_RADIUS + 1.5 : NODE_RADIUS;

                // calculate ref label width to position subject text
                const refLabel = commit.refs.length > 0
                  ? commit.refs.map((r) => r.length > 24 ? r.slice(0, 22) + '…' : r).join(' ')
                  : null;
                const subjectX = refAreaX + (refLabel ? refLabel.length * 5.5 + 8 : 0);

                return (
                  <g key={commit.hash}>
                    <circle
                      cx={commit.x} cy={commit.y} r={r}
                      fill={commit.hasLog ? color : 'transparent'}
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1.5}
                      strokeOpacity={commit.hasLog ? 1 : 0.4}
                      style={{
                        cursor: commit.hasLog ? 'pointer' : 'default',
                        filter: glow,
                        transition: 'filter 0.1s',
                      }}
                      onClick={commit.hasLog ? () => onSelectCommit(commit.hash) : undefined}
                      onMouseEnter={commit.hasLog ? () => setHoveredHash(commit.hash) : undefined}
                      onMouseLeave={commit.hasLog ? () => setHoveredHash(null) : undefined}
                    />

                    {refLabel && (
                      <text
                        x={refAreaX} y={commit.y + 4}
                        fontSize={9} fill={color} fillOpacity={0.75}
                        fontFamily="'Courier New', monospace"
                        style={{ userSelect: 'none' }}
                      >
                        {refLabel}
                      </text>
                    )}

                    <text
                      x={subjectX} y={commit.y + 4}
                      fontSize={10}
                      fill={commit.hasLog ? '#777' : '#3a3a3a'}
                      fontFamily="'Courier New', monospace"
                      style={{ userSelect: 'none' }}
                    >
                      {commit.subject.length > 34 ? commit.subject.slice(0, 32) + '…' : commit.subject}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
