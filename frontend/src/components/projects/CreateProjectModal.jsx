import './CreateProjectModal.css';
import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

export default function CreateProjectModal({ isOpen, onClose, onSubmit, existingNames = [] }) {
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setRepoUrl('');
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
      await onSubmit({
        name: name.trim(),
        repoUrl: repoUrl.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect & Create Project" subtitle="Link a GitHub repository to index code, commits, and PRs into Brain AI.">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. React or Hello World"
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">GitHub Repository URL (Optional)</label>
          <input
            className="form-input"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="e.g. octocat/Hello-World or https://github.com/facebook/react"
          />
          <span style={{ fontSize: '11px', color: '#8FA9A3', marginTop: '4px', display: 'block' }}>
            Enter a public GitHub repository to automatically index commits, issues, and PRs.
          </span>
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
            {submitting ? 'Connecting...' : 'Connect Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
