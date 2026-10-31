import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { Upload, Code2, Wifi, Check, Target, FileText, MoreHorizontal } from 'lucide-react';
import { mockRepositories } from '../data/mockRepositories';
import { mockDocuments } from '../data/mockDocuments';
import './KnowledgeSources.css';

const CATEGORIES = ['All', 'Architecture', 'Engineering', 'Operations', 'Incident'];

function MemoryHealthCard() {
  const reduce = useReducedMotion();
  const score = 86;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="memory-health-card">
      <div className="health-ring-wrap">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle cx="39" cy="39" r="34" fill="none" stroke="rgba(117,198,176,0.15)" strokeWidth="6" />
          <motion.circle
            cx="39" cy="39" r="34" fill="none" stroke="var(--primary)" strokeWidth="6"
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
        <div className="health-pill">HEALTHY MEMORY</div>
        <div className="health-title">Strong context, a few blind spots</div>
        <div className="health-desc">Core modules are well understood. Fast-changing integrations need more decision records.</div>
        <div className="health-progress">
          <div className="health-progress-bar" style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function IndexingPipeline() {
  const steps = [0, 1, 2, 3];
  const current = 2;
  return (
    <div className="indexing-card">
      <div className="indexing-header">
        <div className="indexing-title"><Wifi size={13} /> Indexing pipeline</div>
        <div className="indexing-status">All systems operational</div>
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
      <div className="pipeline-label">Committed → Re-embedding</div>
    </div>
  );
}

function RepositoryRow({ repo }) {
  const iconColor = repo.iconColor === 'teal' ? 'var(--secondary)' : repo.iconColor === 'violet' ? '#a78bfa' : '#fbbf24';
  return (
    <div className="repo-row">
      <div className="repo-left">
        <div className="repo-icon" style={{ color: iconColor }}>
          <Code2 size={14} />
        </div>
        <div>
          <div className="repo-name">{repo.name}</div>
          <div className="repo-sub">{repo.subtitle}</div>
        </div>
      </div>
      <div className="repo-meta">
        <span>{repo.newCommits} new commits</span>
        <span>{repo.prs} PRs</span>
        <span>{repo.issues} issue</span>
      </div>
      <div className="repo-right">
        <span className="synced-pill">{repo.status}</span>
        <span className="repo-time">{repo.lastSynced}</span>
        <button className="menu-btn" aria-label="More options"><MoreHorizontal size={14} /></button>
      </div>
    </div>
  );
}
function DocumentDropzone({ onFiles }) {
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
      className={`doc-dropzone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" multiple hidden accept=".pdf,.docx,.md,.csv" onChange={handleChange} />
      <Upload size={18} />
      <div>
        <div className="drop-main">Drop documents to index</div>
        <div className="drop-sub">or click to browse · PDF, DOCX, MD, CSV up to 25MB</div>
      </div>
    </div>
  );
}

export default function KnowledgeSources() {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState('All');
  const [uploadMsg, setUploadMsg] = useState('');

  const filteredDocs = category === 'All' ? mockDocuments : mockDocuments.filter((d) => d.category === category);

  const handleFiles = (files) => {
    const oversized = files.find((f) => f.size > 25 * 1024 * 1024);
    if (oversized) { setUploadMsg('File exceeds 25MB limit.'); return; }
    setUploadMsg(`Selected ${files.length} file(s) for demo upload.`);
  };

  const handleUploadBtn = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.docx,.md,.csv';
    input.onchange = (e) => handleFiles(Array.from(e.target.files || []));
    input.click();
  };

  return (
    <motion.div className="knowledge-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="knowledge-header">
        <div>
          <div className="knowledge-eyebrow">THE MEMORY LAYER</div>
          <h1 className="knowledge-title">Knowledge</h1>
          <p className="knowledge-subtitle">Manage repository context, documents, and the signals that keep institutional memory alive.</p>
        </div>
        <button className="btn btn-primary upload-btn" onClick={handleUploadBtn}>
          <Upload size={13} /> Upload documents
        </button>
      </div>

      {uploadMsg && <div className="demo-note">{uploadMsg}</div>}

      <div className="health-row">
        <MemoryHealthCard />
        <IndexingPipeline />
      </div>

      <div className="section-row">
        <div>
          <h2 className="section-title">Connected repositories</h2>
          <p className="section-sub">OAuth is simulated locally for hackathon demo reliability.</p>
        </div>
        <div className="connected-pill">3 connected</div>
      </div>

      <div className="repo-list">
        {mockRepositories.map((r) => (
          <RepositoryRow key={r.id} repo={r} />
        ))}
      </div>

      <div className="section-row">
        <div>
          <h2 className="section-title">Knowledge documents</h2>
          <p className="section-sub">Drag and drop PDF, DOCX, Markdown, or Jira exports.</p>
        </div>
        <div className="category-filters">
          {CATEGORIES.map((c) => (
            <button key={c} className={`cat-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <DocumentDropzone onFiles={handleFiles} />

      <div className="doc-table">
        <div className="doc-table-head">
          <div className="col-doc">DOCUMENT</div>
          <div className="col-source">SOURCE</div>
          <div className="col-updated">LAST UPDATED</div>
          <div className="col-score">CONTEXT SCORE</div>
        </div>
        {filteredDocs.map((d) => (
          <div key={d.id} className="doc-table-row">
            <div className="col-doc">
              <FileText size={12} />
              <span>{d.name}</span>
            </div>
            <div className="col-source">
              <Code2 size={12} />
              <span>{d.source}</span>
            </div>
            <div className="col-updated">{d.updated}</div>
            <div className="col-score">{d.score}%</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}