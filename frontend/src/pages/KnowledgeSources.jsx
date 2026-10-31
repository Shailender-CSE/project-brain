import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Upload, Code2, Wifi, Check, Target, FileText,
  Trash2, Loader2, AlertCircle, Github, AlertTriangle,
} from 'lucide-react';
import {
  getKnowledgeSources,
  getTaskStatus,
  startDocumentUpload,
  startRepositoryConnect,
  deleteRepository,
} from '../services/knowledgeService.js';
import './KnowledgeSources.css';

const CATEGORIES = ['All', 'Architecture', 'Engineering', 'Operations', 'Incident'];
const ALLOWED_EXTS = ['.txt', '.md', '.pdf', '.py', '.js', '.ts', '.java', '.json'];
const TASK_KEY = 'pb_active_task_id';
const POLL_INTERVAL = 2000;

/** Map raw backend error text to friendly user messages. */
function friendlyError(raw = '') {
  const m = raw.toLowerCase();
  if (m.includes('job already running') || m.includes('another') || m.includes('409'))
    return 'Another indexing job is already running. Please wait for it to complete.';
  if (m.includes('private') || m.includes('not found') || m.includes('404') || m.includes('repository'))
    return 'Repository not found or is private. Only public GitHub repositories can be indexed.';
  if (m.includes('rate limit') || m.includes('429'))
    return 'GitHub API rate limit reached. Try again in a few minutes, or add a GITHUB_TOKEN to the backend.';
  if (m.includes('invalid') && (m.includes('url') || m.includes('repo')))
    return 'Invalid repository URL. Use "owner/repo" or "https://github.com/owner/repo".';
  if (m.includes('unsupported') || m.includes('file type') || m.includes('extension'))
    return 'File type not supported. Allowed: .txt .md .pdf .py .js .ts .java .json';
  if (m.includes('5 mb') || m.includes('size') || m.includes('large') || m.includes('413'))
    return 'File exceeds the 5 MB limit.';
  if (m.includes('empty'))
    return 'The uploaded file appears to be empty.';
  if (m.includes('failed to fetch') || m.includes('networkerror') || m instanceof TypeError)
    return 'Cannot reach the server. Check that the backend is running.';
  return raw || 'An unexpected error occurred. Please try again.';
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
            cx="39" cy="39" r="34" fill="none"
            stroke="var(--primary)" strokeWidth="6" strokeLinecap="round"
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

function IndexingPipeline({ isIndexing, statusText, isPartial }) {
  const steps = [0, 1, 2, 3];
  const current = isIndexing ? 2 : 3;
  return (
    <div className="indexing-card">
      <div className="indexing-header">
        <div className="indexing-title"><Wifi size={13} /> Ingestion Pipeline</div>
        <div className="indexing-status">
          {isIndexing ? 'Indexing in progress…' : isPartial ? 'Completed (partial)' : 'Pipeline Ready'}
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
        {statusText || (isIndexing ? 'Processing and embedding chunks…' : 'Idle · Awaiting new uploads')}
      </div>
    </div>
  );
}

function RepositoryRow({ repo, onDelete, isDeleting }) {
  const iconColor = repo.iconColor === 'violet' ? '#a78bfa' : 'var(--secondary)';
  return (
    <div className="repo-row">
      <div className="repo-left">
        <div className="repo-icon" style={{ color: iconColor }}><Code2 size={14} /></div>
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
        <button className="menu-btn" title="Reset / delete repository chunks" onClick={() => onDelete(repo)} disabled={isDeleting}>
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
    if (!isUploading) onFiles(Array.from(e.dataTransfer.files || []));
  };
  const handleChange = (e) => {
    if (!isUploading) onFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  return (
    <div
      className={`doc-dropzone ${dragging ? 'dragging' : ''}`}
      onDragEnter={() => setDragging(true)}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      style={{ cursor: isUploading ? 'wait' : 'pointer' }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple hidden
        accept=".txt,.md,.pdf,.py,.js,.ts,.java,.json"
        onChange={handleChange}
        disabled={isUploading}
      />
      {isUploading ? <Loader2 size={22} className="spin" /> : <Upload size={18} />}
      <div>
        <div className="drop-main">
          {isUploading ? 'Indexing document into pgvector…' : 'Drop document to index into Project Brain'}
        </div>
        <div className="drop-sub">or click to browse · .md, .txt, .pdf, .py, .js, .ts, .java, .json (max 5 MB)</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KnowledgeSources() {
  const [category, setCategory] = useState('All');
  const [documents, setDocuments] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [deletingRepoId, setDeletingRepoId] = useState(null);

  // Job state
  const [jobRunning, setJobRunning] = useState(false);
  const [jobStatus, setJobStatus] = useState(''); // progress text shown in pipeline
  const [jobResult, setJobResult] = useState(null); // {kind:'success'|'partial'|'error', text, chunks}
  const [repoInput, setRepoInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const pollRef = useRef(null);

  // ── Sources loader ──────────────────────────────────────────────────────────
  const loadSources = useCallback(async () => {
    try {
      const data = await getKnowledgeSources();
      setDocuments(data.documents || []);
      setRepositories(data.repositories || []);
    } catch (err) {
      console.warn('Could not load knowledge sources:', err.message);
    }
  }, []);

  useEffect(() => { loadSources(); }, [loadSources]);

  // ── Single polling timer ────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((taskId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getTaskStatus(taskId);

        if (s.progress) setJobStatus(s.progress);

        if (s.status === 'completed') {
          stopPolling();
          localStorage.removeItem(TASK_KEY);
          setJobRunning(false);
          setJobResult({ kind: 'success', text: `Indexed successfully — ${s.chunks_ingested ?? '?'} chunks stored.`, chunks: s.chunks_ingested });
          setJobStatus('');
          loadSources();
          return;
        }
        if (s.status === 'completed (partial)') {
          stopPolling();
          localStorage.removeItem(TASK_KEY);
          setJobRunning(false);
          setJobResult({ kind: 'partial', text: `Indexing completed with some data skipped (partial). ${s.chunks_ingested ?? '?'} chunks stored. Some items may have been omitted due to API limits or rate limiting.` });
          setJobStatus('');
          loadSources();
          return;
        }
        if (s.status === 'failed') {
          stopPolling();
          localStorage.removeItem(TASK_KEY);
          setJobRunning(false);
          setJobResult(null);
          setErrorMessage(friendlyError(s.error));
          setJobStatus('');
          return;
        }
      } catch (err) {
        // 404 means task_id no longer exists
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          stopPolling();
          localStorage.removeItem(TASK_KEY);
          setJobRunning(false);
          setJobStatus('');
          setJobResult(null);
          return;
        }
        // Network hiccup — keep polling
        console.warn('Poll error (will retry):', err.message);
      }
    }, POLL_INTERVAL);
  }, [stopPolling, loadSources]);

  // ── Restore in-progress job from localStorage on mount ─────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(TASK_KEY);
    if (saved) {
      setJobRunning(true);
      setJobStatus('Resuming indexing job…');
      startPolling(saved);
    }
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFiles = async (files) => {
    setErrorMessage('');
    setJobResult(null);
    if (!files?.length) return;

    const file = files[0];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMessage(`File type not supported ('${ext}'). Allowed: ${ALLOWED_EXTS.join(', ')}`);
      return;
    }
    if (file.size === 0) { setErrorMessage('The uploaded file appears to be empty.'); return; }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(`File exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setJobRunning(true);
    setJobStatus(`Uploading ${file.name}…`);
    try {
      const { task_id } = await startDocumentUpload(file);
      localStorage.setItem(TASK_KEY, task_id);
      setJobStatus('Embedding chunks…');
      startPolling(task_id);
    } catch (err) {
      setJobRunning(false);
      setJobStatus('');
      setErrorMessage(friendlyError(err.message));
    }
  };

  const handleUploadBtn = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.pdf,.py,.js,.ts,.java,.json';
    input.onchange = (e) => handleFiles(Array.from(e.target.files || []));
    input.click();
  };

  // ── Repo connect handler ────────────────────────────────────────────────────
  const handleConnectRepo = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setJobResult(null);
    const target = repoInput.trim();
    if (!target) { setErrorMessage('Please enter a GitHub repository URL or owner/repo.'); return; }

    setJobRunning(true);
    setJobStatus(`Connecting to ${target}…`);
    try {
      const { task_id } = await startRepositoryConnect(target);
      localStorage.setItem(TASK_KEY, task_id);
      setJobStatus('Fetching commits, issues, and PRs…');
      setRepoInput('');
      startPolling(task_id);
    } catch (err) {
      setJobRunning(false);
      setJobStatus('');
      setErrorMessage(friendlyError(err.message));
    }
  };

  // ── Delete repo handler ─────────────────────────────────────────────────────
  const handleDeleteRepo = async (repo) => {
    if (!window.confirm(`Delete all indexed chunks for '${repo.name}'?`)) return;
    setDeletingRepoId(repo.id);
    setErrorMessage('');
    try {
      await deleteRepository(repo.id);
      setJobResult({ kind: 'success', text: `Deleted chunks for ${repo.name}.` });
      loadSources();
    } catch (err) {
      setErrorMessage(friendlyError(err.message));
    } finally {
      setDeletingRepoId(null);
    }
  };

  const filteredDocs =
    category === 'All'
      ? documents
      : documents.filter((d) => d.category === category || d.source === category);

  const isPartial = jobResult?.kind === 'partial';

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
        <button className="btn btn-primary upload-btn" onClick={handleUploadBtn} disabled={jobRunning}>
          <Upload size={13} /> {jobRunning ? 'Indexing…' : 'Upload document'}
        </button>
      </div>

      {/* Job result banners */}
      {jobResult?.kind === 'success' && (
        <div className="status-banner status-success">
          <Check size={14} /> <span>{jobResult.text}</span>
        </div>
      )}
      {jobResult?.kind === 'partial' && (
        <div className="status-banner status-partial">
          <AlertTriangle size={14} />
          <span>{jobResult.text}</span>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="status-banner status-error">
          <AlertCircle size={14} /> <span>{errorMessage}</span>
          <button className="banner-dismiss" onClick={() => setErrorMessage('')} type="button">✕</button>
        </div>
      )}

      <div className="health-row">
        <MemoryHealthCard totalDocs={documents.length} totalRepos={repositories.length} />
        <IndexingPipeline isIndexing={jobRunning} statusText={jobStatus} isPartial={isPartial} />
      </div>

      {/* GitHub Repository Connection Form */}
      <div className="section-row" style={{ marginTop: 24 }}>
        <div>
          <h2 className="section-title">Connect Public GitHub Repository</h2>
          <p className="section-sub">
            Ingest up to 100 commits, 50 issues, and 50 PRs with linked issue references.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleConnectRepo}
        style={{
          display: 'flex', gap: 10, marginBottom: 20,
          background: 'rgba(45, 68, 78, 0.5)', padding: 12,
          borderRadius: 8, border: '1px solid rgba(117,198,176,0.18)',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input"
            placeholder="e.g. facebook/react or https://github.com/owner/repo"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            disabled={jobRunning}
            style={{ width: '100%', paddingLeft: 34 }}
          />
          <Github size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8FA9A3' }} />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={jobRunning || !repoInput.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140, justifyContent: 'center' }}
        >
          {jobRunning ? (
            <><Loader2 size={14} className="spin" /><span>Indexing…</span></>
          ) : (
            <><Code2 size={14} /><span>Index Repo</span></>
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
            <button key={c} className={`cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <DocumentDropzone onFiles={handleFiles} isUploading={jobRunning} />

      <div className="doc-table">
        <div className="doc-table-head">
          <div className="col-doc">DOCUMENT</div>
          <div className="col-source">SOURCE</div>
          <div className="col-updated">CHUNKS</div>
          <div className="col-score">CONTEXT SCORE</div>
        </div>
        {filteredDocs.length === 0 ? (
          <div style={{ padding: '16px', color: '#8FA9A3', fontSize: '13px', textAlign: 'center' }}>
            No documents indexed yet. Upload a file above.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div key={doc.id || doc.name} className="doc-table-row">
              <div className="col-doc">
                <FileText size={13} />
                <span title={doc.name}>{doc.name}</span>
              </div>
              <div className="col-source">
                <span title={doc.source}>{doc.source}</span>
              </div>
              <div className="col-updated">{doc.chunks ?? 0}</div>
              <div className="col-score">{doc.score ?? 90}%</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
