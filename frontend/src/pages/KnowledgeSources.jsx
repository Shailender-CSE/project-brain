import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import {
  Upload,
  Code2,
  Wifi,
  Check,
  Target,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Github,
} from 'lucide-react';
import knowledgeService from '../services/knowledgeService.js';
import './KnowledgeSources.css';

const CATEGORIES = ['All', 'Architecture', 'Engineering', 'Operations', 'Incident'];
const ALLOWED_EXTS = ['.txt', '.md', '.pdf', '.py', '.js', '.ts', '.java', '.json'];

function MemoryHealthCard({ totalDocs = 0, totalRepos = 0 }) {
  const reduce = useReducedMotion();
  const score = Math.min(100, Math.max(30, 40 + totalDocs * 10 + totalRepos * 15));
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="memory-health-card">
      <div className="health-ring-wrap">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle cx="39" cy="39" r="34" fill="none" stroke="rgba(117,198,176,0.15)" strokeWidth="6" />
          <motion.circle
            cx="39"
            cy="39"
            r="34"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            transform="rotate(-90 39 39)"
          />
        </svg>
        <div className="health-ring-center">
          <div className="health-score">{score}</div>
          <div className="health-score-sub">/100</div>
        </div>
      </div>
      <div className="health-text">
        <div className="health-pill">RAG KNOWLEDGE HEALTH</div>
        <div className="health-title">Active Institutional Context</div>
        <div className="health-desc">
          {totalDocs} document(s) and {totalRepos} repository source(s) indexed with 384-d pgvector embeddings.
        </div>
        <div className="health-progress">
          <div className="health-progress-bar" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function IndexingPipeline({ isIndexing, statusText }) {
  const steps = [0, 1, 2, 3];
  const current = isIndexing ? 2 : 3;
  return (
    <div className="indexing-card">
      <div className="indexing-header">
        <div className="indexing-title">
          <Wifi size={13} /> Ingestion Pipeline
        </div>
        <div className="indexing-status">
          {isIndexing ? 'Indexing in progress...' : 'Pipeline Ready'}
        </div>
      </div>
      <div className="pipeline">
        {steps.map((s, i) => (
          <div key={s} className="pipeline-step-wrap">
            {i > 0 && <div className="pipeline-connector" />}
            <div className={`pipeline-step ${i < current ? 'done' : i === current ? 'current' : 'pending'}`}>
              {i < current ? <Check size={10} /> : i === current ? <Target size={10} /> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="pipeline-label">
        {statusText || (isIndexing ? 'Processing and embedding chunks...' : 'Idle · Awaiting new uploads')}
      </div>
    </div>
  );
}

function RepositoryRow({ repo, onDelete, isDeleting }) {
  const iconColor = repo.iconColor === 'violet' ? '#a78bfa' : 'var(--secondary)';
  return (
    <div className="repo-row">
      <div className="repo-left">
        <div className="repo-icon" style={{ color: iconColor }}>
          <Code2 size={14} />
        </div>
        <div>
          <div className="repo-name">{repo.name}</div>
          <div className="repo-sub">{repo.subtitle || 'Public GitHub Repository'}</div>
        </div>
      </div>
      <div className="repo-meta">
        <span>{repo.commits || 0} commits</span>
        <span>{repo.prs || 0} PRs</span>
        <span>{repo.issues || 0} issues</span>
      </div>
      <div className="repo-right">
        <span className="synced-pill">{repo.status || 'Synced'}</span>
        <span className="repo-time">{repo.lastSynced}</span>
        <button
          className="menu-btn"
          title="Reset / delete repository chunks"
          onClick={() => onDelete(repo)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

function DocumentDropzone({ onFiles, isUploading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) onFiles(files);
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  return (
    <div
      className={`doc-dropzone ${dragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      style={{ cursor: isUploading ? 'wait' : 'pointer' }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".txt,.md,.pdf,.py,.js,.ts,.java,.json"
        onChange={handleChange}
        disabled={isUploading}
      />
      {isUploading ? <Loader2 size={22} className="spin" /> : <Upload size={18} />}
      <div>
        <div className="drop-main">
          {isUploading ? 'Indexing document into pgvector...' : 'Drop document to index into Project Brain'}
        </div>
        <div className="drop-sub">
          or click to browse · .md, .txt, .pdf, .py, .js, .ts, .java, .json (max 5 MB)
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeSources() {
  const [category, setCategory] = useState('All');
  const [documents, setDocuments] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [repoInput, setRepoInput] = useState('');
  const [isConnectingRepo, setIsConnectingRepo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingRepoId, setDeletingRepoId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch live knowledge sources on mount
  const loadSources = async () => {
    try {
      const data = await knowledgeService.getKnowledgeSources();
      setDocuments(data.documents || []);
      setRepositories(data.repositories || []);
    } catch (err) {
      console.warn('Could not load knowledge sources:', err.message);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleFiles = async (files) => {
    setErrorMessage('');
    if (!files || !files.length) return;

    const file = files[0];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMessage(`Invalid file format '${ext}'. Allowed types: ${ALLOWED_EXTS.join(', ')}`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(`File exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setIsUploading(true);
    setStatusMessage(`Uploading ${file.name}...`);

    try {
      await knowledgeService.uploadDocument(file, (progress) => {
        setStatusMessage(progress);
      });
      setStatusMessage(`Indexed ${file.name} successfully!`);
      await loadSources();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Document upload and indexing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadBtn = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.pdf,.py,.js,.ts,.java,.json';
    input.onchange = (e) => handleFiles(Array.from(e.target.files || []));
    input.click();
  };

  const handleConnectRepo = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const target = repoInput.trim();
    if (!target) {
      setErrorMessage('Please enter a GitHub repository URL or owner/repo.');
      return;
    }

    setIsConnectingRepo(true);
    setStatusMessage(`Connecting to ${target}...`);

    try {
      await knowledgeService.connectRepository(target, (progress) => {
        setStatusMessage(progress);
      });
      setStatusMessage(`Repository ${target} indexed successfully!`);
      setRepoInput('');
      await loadSources();
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to ingest repository.');
    } finally {
      setIsConnectingRepo(false);
    }
  };

  const handleDeleteRepo = async (repo) => {
    if (!window.confirm(`Are you sure you want to delete all indexed chunks for repository '${repo.name}'?`)) {
      return;
    }
    setDeletingRepoId(repo.id);
    setErrorMessage('');
    try {
      await knowledgeService.deleteRepository(repo.id);
      setStatusMessage(`Deleted chunks for ${repo.name}.`);
      await loadSources();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete repository chunks.');
    } finally {
      setDeletingRepoId(null);
    }
  };

  const filteredDocs =
    category === 'All'
      ? documents
      : documents.filter((d) => d.category === category || d.source === category);

  return (
    <motion.div
      className="knowledge-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="knowledge-header">
        <div>
          <div className="knowledge-eyebrow">THE MEMORY LAYER</div>
          <h1 className="knowledge-title">Knowledge Sources</h1>
          <p className="knowledge-subtitle">
            Upload project documents or connect public GitHub repositories to power your RAG assistant.
          </p>
        </div>
        <button className="btn btn-primary upload-btn" onClick={handleUploadBtn} disabled={isUploading}>
          <Upload size={13} /> {isUploading ? 'Uploading...' : 'Upload document'}
        </button>
      </div>

      {statusMessage && (
        <div className="demo-note" style={{ background: 'rgba(21, 157, 145, 0.15)', borderColor: 'var(--primary)' }}>
          <Check size={14} style={{ color: 'var(--primary)' }} />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="demo-note"
          style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#fca5a5' }}
        >
          <AlertCircle size={14} style={{ color: '#ef4444' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="health-row">
        <MemoryHealthCard totalDocs={documents.length} totalRepos={repositories.length} />
        <IndexingPipeline isIndexing={isUploading || isConnectingRepo} statusText={statusMessage} />
      </div>

      {/* GitHub Repository Connection Form */}
      <div className="section-row" style={{ marginTop: 24 }}>
        <div>
          <h2 className="section-title">Connect Public GitHub Repository</h2>
          <p className="section-sub">
            Ingest up to 100 commits, 50 issues, and 50 PRs with diffs and linked issue references.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleConnectRepo}
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          background: 'rgba(45, 68, 78, 0.5)',
          padding: 12,
          borderRadius: 8,
          border: '1px solid rgba(117,198,176,0.18)',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input"
            placeholder="e.g. facebook/react or https://github.com/owner/repo"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            disabled={isConnectingRepo}
            style={{ width: '100%', paddingLeft: 34 }}
          />
          <Github
            size={16}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8FA9A3' }}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isConnectingRepo || !repoInput.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140, justifyContent: 'center' }}
        >
          {isConnectingRepo ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Indexing...</span>
            </>
          ) : (
            <>
              <Code2 size={14} />
              <span>Index Repo</span>
            </>
          )}
        </button>
      </form>

      <div className="section-row">
        <div>
          <h2 className="section-title">Connected Repositories</h2>
          <p className="section-sub">Public repositories currently indexed in the vector database.</p>
        </div>
        <div className="connected-pill">{repositories.length} connected</div>
      </div>

      <div className="repo-list">
        {repositories.length === 0 ? (
          <div style={{ padding: '16px', color: '#8FA9A3', fontSize: '13px', textAlign: 'center' }}>
            No repositories indexed yet. Connect a public repository above.
          </div>
        ) : (
          repositories.map((r) => (
            <RepositoryRow
              key={r.id || r.name}
              repo={r}
              onDelete={handleDeleteRepo}
              isDeleting={deletingRepoId === r.id}
            />
          ))
        )}
      </div>

      <div className="section-row" style={{ marginTop: 24 }}>
        <div>
          <h2 className="section-title">Knowledge Documents</h2>
          <p className="section-sub">Drag and drop Markdown, PDF, text, or source code files.</p>
        </div>
        <div className="category-filters">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`cat-tab ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <DocumentDropzone onFiles={handleFiles} isUploading={isUploading} />

      <div className="doc-table">
        <div className="doc-table-head">
          <div className="col-doc">DOCUMENT</div>
          <div className="col-source">SOURCE</div>
          <div className="col-updated">CHUNKS</div>
          <div className="col-score">CONTEXT SCORE</div>
        </div>
        {filteredDocs.length === 0 ? (
          <div style={{ padding: '16px', color: '#8FA9A3', fontSize: '13px', textAlign: 'center' }}>
            No documents uploaded yet. Upload a document above.
          </div>
        ) : (
          filteredDocs.map((d) => (
            <div key={d.id} className="doc-table-row">
              <div className="col-doc">
                <FileText size={12} />
                <span>{d.name}</span>
              </div>
              <div className="col-source">
                <Code2 size={12} />
                <span>{d.source}</span>
              </div>
              <div className="col-updated">{d.chunks} chunk(s)</div>
              <div className="col-score">{d.score || 95}%</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
