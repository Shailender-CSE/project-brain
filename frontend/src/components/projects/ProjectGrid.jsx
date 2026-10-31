import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import './ProjectGrid.css';
import ProjectCard from './ProjectCard';

export default function ProjectGrid({ projects, viewMode = 'grid', onExplore, onAskBrain, onManageSources, onViewDetails, onRemove, onConnectRepository, onSync, syncingIds }) {
  if (viewMode === 'list') {
    return (
      <div className="project-list">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            viewMode="list"
            onExplore={() => onExplore(p)}
            onAskBrain={() => onAskBrain(p)}
            onManageSources={() => onManageSources && onManageSources(p)}
            onViewDetails={() => onViewDetails(p)}
            onRemove={() => onRemove(p)}
            onSync={() => onSync(p)}
            isSyncing={syncingIds.has(p.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="project-grid">
      <AnimatePresence>
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            viewMode="grid"
            onExplore={() => onExplore(p)}
            onAskBrain={() => onAskBrain(p)}
            onManageSources={() => onManageSources && onManageSources(p)}
            onViewDetails={() => onViewDetails(p)}
            onRemove={() => onRemove(p)}
            onSync={() => onSync(p)}
            isSyncing={syncingIds.has(p.id)}
          />
        ))}
      </AnimatePresence>
      <motion.button
        className="connect-repo-tile"
        onClick={onConnectRepository}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Plus size={22} />
        <div className="connect-title">Connect a repository</div>
        <div className="connect-sub">GitHub, GitLab, or local import</div>
      </motion.button>
    </div>
  );
}
