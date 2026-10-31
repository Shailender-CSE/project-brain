import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Github, Upload, GitCommit, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';

export default function QuickActions() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [repoOpen, setRepoOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectedMsg, setConnectedMsg] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const actions = [
    { id: 'connect', label: 'Connect GitHub Repository', description: 'Link a repository to begin indexing.', icon: Github, onClick: () => setRepoOpen(true) },
    { id: 'upload', label: 'Upload Documents', description: 'Add architecture and spec documents.', icon: Upload, onClick: () => fileInputRef.current?.click() },
    { id: 'commits', label: 'Explore Commit History', description: 'Browse analyzed commits.', icon: GitCommit, onClick: () => navigate('/commits') },
    { id: 'ask', label: 'Ask Brain AI', description: 'Query your engineering knowledge.', icon: Sparkles, onClick: () => navigate('/assistant') },
  ];

  const handleConnect = async () => {
    if (!repoUrl.trim()) return;
    setConnecting(true);
    setConnectedMsg('');
    await new Promise((r) => setTimeout(r, 700));
    setConnecting(false);
    setConnectedMsg('Demo: repository connection workflow initiated. Backend integration is not enabled.');
    setRepoUrl('');
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setSelectedFiles(files);
    setUploadOpen(true);
    e.target.value = '';
  };

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

      <input ref={fileInputRef} type="file" multiple hidden onChange={handleFiles} />

      <Modal isOpen={repoOpen} onClose={() => setRepoOpen(false)} title="Connect GitHub Repository" subtitle="Frontend demo workflow. Backend integration is not enabled.">
        <div className="form-group">
          <label className="form-label">Repository URL</label>
          <input className="form-input" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repository" />
        </div>
        {connectedMsg && <div className="demo-note">{connectedMsg}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setRepoOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConnect} disabled={connecting || !repoUrl.trim()}>
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Documents" subtitle="Frontend demo. Selected files are not uploaded.">
        {selectedFiles.length === 0 ? (
          <p className="demo-note">No files selected.</p>
        ) : (
          <ul className="file-list">
            {selectedFiles.map((f) => (
              <li key={f.name}>
                <span>{f.name}</span>
                <span className="file-size">{Math.max(1, Math.round(f.size / 1024))} KB</span>
              </li>
            ))}
          </ul>
        )}
        <div className="demo-note" style={{ marginTop: 12 }}>Demo only: file upload backend is not connected.</div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setUploadOpen(false)}>Done</button>
        </div>
      </Modal>
    </motion.section>
  );
}
