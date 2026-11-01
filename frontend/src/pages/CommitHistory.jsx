import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GitCommit, RefreshCw, ExternalLink, Search, Loader2 } from 'lucide-react';
import { getCommits } from '../services/commitService.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CommitHistory() {
  const reduce = useReducedMotion();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState('');
  const [repos, setRepos] = useState([]);

  const fetchCommits = async (repo = repoFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await getCommits(repo || null, 100);
      setCommits(data);
      // Build unique repo list for filter
      const uniqueRepos = [...new Set(data.map((c) => c.repo).filter(Boolean))];
      setRepos(uniqueRepos);
    } catch (e) {
      setError(e.message || 'Failed to load commits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommits(); }, []);

  const filtered = commits.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.message?.toLowerCase().includes(q) ||
      c.author?.toLowerCase().includes(q) ||
      c.hash?.toLowerCase().includes(q) ||
      c.repo?.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Commit History</h1>
        <p className="page-subtitle">All indexed commits from connected repositories.</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8FA9A3' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, width: '100%' }}
            placeholder="Search commits, authors, hashes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ minWidth: 180 }}
          value={repoFilter}
          onChange={(e) => { setRepoFilter(e.target.value); fetchCommits(e.target.value); }}
        >
          <option value="">All Repositories</option>
          {repos.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => fetchCommits()} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* State: loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px', color: '#8FA9A3' }}>
          <Loader2 size={18} className="spin" /> Loading commits…
        </div>
      )}

      {/* State: error */}
      {!loading && error && (
        <div className="error-state">
          <RefreshCw size={32} />
          <h3>Failed to load</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchCommits()} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* State: empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <GitCommit size={40} />
          <h3>{commits.length === 0 ? 'No commits indexed' : 'No matching commits'}</h3>
          <p>{commits.length === 0
            ? 'Connect a GitHub repository in Knowledge Sources to index commits.'
            : 'Try a different search term or repository filter.'
          }</p>
        </div>
      )}

      {/* Commit list */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto',
            gap: 12, padding: '8px 16px',
            color: '#8FA9A3', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: '1px solid rgba(117,198,176,0.1)',
          }}>
            <span>Commit</span>
            <span>Author</span>
            <span>Date</span>
          </div>
          {filtered.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(idx * 0.02, 0.3) }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                gap: 12, padding: '12px 16px', alignItems: 'center',
                borderBottom: '1px solid rgba(117,198,176,0.07)',
                borderRadius: 6,
              }}
              className="commit-row"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <GitCommit size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{c.message}</span>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" style={{ color: '#8FA9A3', marginLeft: 'auto' }}>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: '12px', color: '#8FA9A3' }}>
                  <span style={{ background: 'rgba(117,198,176,0.1)', padding: '1px 6px', borderRadius: 4 }}>{c.repo}</span>
                  <code style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{c.hash}</code>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#8FA9A3', whiteSpace: 'nowrap' }}>{c.author}</div>
              <div style={{ fontSize: '12px', color: '#8FA9A3', whiteSpace: 'nowrap' }}>{formatDate(c.date)}</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
