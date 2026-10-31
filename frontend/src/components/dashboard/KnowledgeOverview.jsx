import { motion } from 'framer-motion';
import { Database, Files, GitCommit, Clock, Activity } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { knowledgeOverview } from '../../data/mockDashboard';

export default function KnowledgeOverview() {
  const reduce = useReducedMotion();
  const k = knowledgeOverview;
  const items = [
    { label: 'Total Repositories', value: k.totalRepositories, icon: Database },
    { label: 'Total Files Indexed', value: k.totalFilesIndexed, icon: Files },
    { label: 'Total Commits Processed', value: k.totalCommitsProcessed, icon: GitCommit },
    { label: 'Last Successful Sync', value: k.lastSuccessfulSync, icon: Clock },
  ];

  return (
    <motion.section
      className="knowledge-overview"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="section-header">
        <div>
          <h2 className="section-title">Knowledge Overview</h2>
          <p className="section-subtitle">How much historical engineering knowledge Brain AI has collected.</p>
        </div>
        <div className="section-badge">
          <Activity size={14} /> {k.indexingProgress}% indexed
        </div>
      </div>

      <div className="knowledge-grid">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="knowledge-stat">
              <div className="knowledge-icon"><Icon size={16} /></div>
              <div>
                <div className="knowledge-value">{typeof it.value === 'number' ? it.value.toLocaleString() : it.value}</div>
                <div className="knowledge-label">{it.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="knowledge-progress">
        <div className="knowledge-progress-head">
          <span>Overall indexing progress</span>
          <span>{k.indexingProgress}%</span>
        </div>
        <div className="knowledge-progress-track">
          <motion.div
            className="knowledge-progress-bar"
            initial={reduce ? { width: `${k.indexingProgress}%` } : { width: 0 }}
            animate={{ width: `${k.indexingProgress}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>
    </motion.section>
  );
}
