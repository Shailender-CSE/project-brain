import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { GitCommit, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiRequest from '../../services/api.js';

export default function RecentCommits() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/commits?limit=5')
      .then((data) => setCommits(data.commits || []))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.section
      className="recent-commits"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
    >
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Commits</h2>
          <p className="section-subtitle">Latest analyzed commits across repositories.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/commits')}>
          View All Commits <ArrowRight size={14} />
        </button>
      </div>

      <div className="commit-list">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', color: '#8FA9A3', fontSize: '13px' }}>
            <Loader2 size={14} className="spin" /> Loading commits…
          </div>
        )}
        {!loading && commits.length === 0 && (
          <div style={{ padding: '16px', color: '#8FA9A3', fontSize: '13px', textAlign: 'center' }}>
            No commits indexed yet. Connect a repository in Knowledge Sources.
          </div>
        )}
        {commits.map((c, idx) => (
          <motion.div
            key={c.id}
            className="commit-row"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : idx * 0.04 }}
          >
            <div className="commit-icon"><GitCommit size={15} /></div>
            <div className="commit-main">
              <div className="commit-message">{c.message}</div>
              <div className="commit-meta">
                <span>{c.repo}</span>
                <span>·</span>
                <span>{c.author}</span>
                <span>·</span>
                <span className="commit-hash">{c.hash}</span>
              </div>
            </div>
            <div className="commit-side">
              <span className="commit-branch">{c.branch}</span>
              <span className="commit-date">{c.date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
