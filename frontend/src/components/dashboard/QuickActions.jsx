import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Github, Upload, GitCommit, Sparkles } from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const actions = [
    {
      id: 'connect',
      label: 'Connect GitHub Repository',
      description: 'Link a repository to begin indexing.',
      icon: Github,
      onClick: () => navigate('/knowledge'),
    },
    {
      id: 'upload',
      label: 'Upload Documents',
      description: 'Add architecture and spec documents.',
      icon: Upload,
      onClick: () => navigate('/knowledge'),
    },
    {
      id: 'commits',
      label: 'Explore Commit History',
      description: 'Browse analyzed commits.',
      icon: GitCommit,
      onClick: () => navigate('/commits'),
    },
    {
      id: 'ask',
      label: 'Ask Brain AI',
      description: 'Query your engineering knowledge.',
      icon: Sparkles,
      onClick: () => navigate('/assistant'),
    },
  ];

  return (
    <motion.section
      className="quick-actions"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
    >
      <div className="section-header">
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-subtitle">Start building your institutional knowledge base.</p>
        </div>
      </div>

      <div className="quick-grid">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.id}
              className="quick-card"
              onClick={a.onClick}
              whileHover={reduce ? {} : { y: -3 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="quick-icon"><Icon size={20} /></div>
              <div className="quick-text">
                <div className="quick-label">{a.label}</div>
                <div className="quick-desc">{a.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
