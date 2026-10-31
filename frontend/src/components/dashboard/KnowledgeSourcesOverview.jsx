import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Github, FileText, ArrowRight } from 'lucide-react';
import { knowledgeSources } from '../../data/mockDashboard';

export default function KnowledgeSourcesOverview() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  return (
    <motion.section
      className="knowledge-sources"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
    >
      <div className="section-header">
        <div>
          <h2 className="section-title">Knowledge Sources</h2>
          <p className="section-subtitle">Sources contributing to the institutional knowledge base.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/knowledge')}>
          View All Sources <ArrowRight size={14} />
        </button>
      </div>

      <div className="source-list">
        {knowledgeSources.map((s, idx) => {
          const Icon = s.type === 'github' ? Github : FileText;
          return (
            <motion.div
              key={s.id}
              className="source-row"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : idx * 0.04 }}
            >
              <div className="source-icon"><Icon size={16} /></div>
              <div className="source-main">
                <div className="source-name">{s.name}</div>
                <div className="source-meta">{s.items} indexed items</div>
              </div>
              <div className={`source-status ${s.status === 'Synced' ? 'synced' : 'processing'}`}>
                {s.status}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}