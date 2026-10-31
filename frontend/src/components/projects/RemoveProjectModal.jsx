import { motion, AnimatePresence } from 'framer-motion';

export default function RemoveProjectModal({ isOpen, project, onCancel, onConfirm, loading }) {
  if (!isOpen || !project) return null;
  return (
    <AnimatePresence>
      <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
        <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
          <h2>Remove from Brain AI</h2>
          <p className="sub">
            Remove <strong style={{ color: 'var(--text)' }}>{project.name}</strong> from Brain AI? This only unregisters the project. Your GitHub repository and external files will not be deleted.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
              {loading ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
