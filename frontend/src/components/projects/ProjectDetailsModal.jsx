import { motion } from 'framer-motion';
import { formatDate } from '../../utils/formatDate';

export default function ProjectDetailsModal({ isOpen, onClose, project }) {
  if (!isOpen || !project) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <h2>{project.name}</h2>
        <p className="sub">{project.description}</p>
        <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
          <div>Status: {project.status}</div>
          <div>Repositories: {project.repositories}</div>
          <div>Documents: {project.documents}</div>
          <div>Commits: {project.commits}</div>
          <div>Last Synced: {project.lastSynced}</div>
          <div>Indexing: {project.indexingProgress}%</div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}
