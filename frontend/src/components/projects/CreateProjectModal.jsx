import './CreateProjectModal.css';
import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function CreateProjectModal({ isOpen, onClose, onSubmit, existingNames = [] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed) return 'Project name is required.';
    if (trimmed.length < 3) return 'Project name must be at least 3 characters.';
    const duplicate = existingNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return 'A project with this name already exists.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Existing Project" subtitle="Bring your team's existing project knowledge into Brain AI.">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Banking Application"
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Project Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the software project..."
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Importing...' : 'Import Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
