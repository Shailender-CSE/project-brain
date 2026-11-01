import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { GitBranch, GitCommit, FileText, RefreshCw, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiRequest from '../../services/api.js';

const ICONS = {
  repo: GitBranch,
  commit: GitCommit,
  document: FileText,
  sync: RefreshCw,
  ai: Sparkles,
};

const STATUS_COLORS = {
  success: 'var(--primary)',
  info: 'var(--secondary)',
};

export default function RecentActivity() {
  const reduce = useReducedMotion();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/dashboard')
      .then((data) => setActivities(data.recent_activity || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.section
      className="recent-activity"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
    >
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Activity</h2>
          <p className="section-subtitle">Latest events across your knowledge base.</p>
        </div>
      </div>

      <div className="timeline">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px', color: '#8FA9A3', fontSize: '13px' }}>
            <Loader2 size={14} className="spin" /> Loading…
          </div>
        )}
        {!loading && activities.length === 0 && (
          <div style={{ padding: '16px', color: '#8FA9A3', fontSize: '13px', textAlign: 'center' }}>
            No activity yet. Index a repository or upload a document to get started.
          </div>
        )}
        {activities.map((a, idx) => {
          const Icon = ICONS[a.type] || CheckCircle2;
          return (
            <motion.div
              key={a.id}
              className="timeline-item"
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : idx * 0.05 }}
            >
              <div className="timeline-icon" style={{ color: STATUS_COLORS[a.status] || 'var(--muted)' }}>
                <Icon size={16} />
              </div>
              <div className="timeline-body">
                <div className="timeline-title">{a.title}</div>
                <div className="timeline-desc">{a.description}</div>
                <div className="timeline-meta">
                  <span className="timeline-target">{a.target}</span>
                  <span className="timeline-time">{a.time}</span>
                </div>
              </div>
              <div className="timeline-status">
                <span className={`status-dot status-${a.status}`} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
