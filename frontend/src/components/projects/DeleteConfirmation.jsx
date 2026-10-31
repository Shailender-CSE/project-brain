import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmDialog({ project, onCancel, onConfirm, loading }) {
  if (!project) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: 420 }}>
        <h2>Delete Project</h2>
        <p className="sub">
          Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{project.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff8a80', fontSize: 13, marginBottom: 8 }}>
          <AlertTriangle size={16} /> All project data references will be removed.
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
