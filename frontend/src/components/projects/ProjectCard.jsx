import { motion } from 'framer-motion';
import { Code2, GitBranch, FileText, Brain, ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import './ProjectCard.css';
import ProjectActionsMenu from './ProjectActionsMenu';

const ICON_COLORS = {
  teal: 'var(--secondary)',
  violet: '#a78bfa',
  amber: '#fbbf24',
};

export default function ProjectCard({ project, viewMode = 'grid', onExplore, onAskBrain, onManageSources, onViewDetails, onRemove, onSync, isSyncing }) {
  const reduce = useReducedMotion();
  const health = project.memoryHealth ?? project.indexingProgress ?? 0;
  const branch = project.branch || 'main';
  const files = project.files ? `${project.files} files` : `${project.documents ?? 0} files`;
  const iconColor = ICON_COLORS[project.iconColor] || 'var(--secondary)';

  return (
    <motion.div
      className={`project-card project-card-${viewMode}`}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={reduce ? {} : { y: -2 }}
    >
      <div className="card-top">
        <div className="card-icon" style={{ color: iconColor }}>
          <Code2 size={15} />
        </div>
        <ProjectActionsMenu
          onExplore={onExplore}
          onManageSources={onManageSources}
          onViewDetails={onViewDetails}
          onRemove={onRemove}
        />
      </div>

      <div className="card-title">{project.name}</div>
      <div className="card-desc">{project.description}</div>

      <div className="card-divider" />

      <div className="card-meta">
        <span><GitBranch size={12} /> {branch}</span>
        <span><FileText size={12} /> {files}</span>
      </div>

      <div className="card-divider" />

      <div className="memory-health">
        <div className="memory-health-head">
          <span>Memory health</span>
          <span className="memory-health-value">{health}%</span>
        </div>
        <div className="memory-health-track">
          <div className="memory-health-bar" style={{ width: `${health}%` }} />
        </div>
      </div>

      <div className="card-footer">
        <button className="memory-btn" onClick={onExplore}>
          <Brain size={13} /> Memory
        </button>
        <button className="ask-brain-btn" onClick={onAskBrain}>
          <ArrowRight size={13} /> Ask brain
        </button>
      </div>
    </motion.div>
  );
}
