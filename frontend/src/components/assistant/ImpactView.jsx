import { useState, useRef } from 'react';
import { Search, AlertTriangle, FileCode, Cpu, Zap, ExternalLink, Info, Loader2 } from 'lucide-react';
import { getImpact } from '../../services/assistantService.js';

const KIND_ICON = {
  file: <FileCode size={12} />,
  component: <Cpu size={12} />,
  feature: <Zap size={12} />,
};

const CONF_CLASS = {
  high: 'conf-high',
  medium: 'conf-medium',
  low: 'conf-low',
};

function mapBackendError(msg) {
  if (!msg) return 'The request failed. Please try again.';
  const m = msg.toLowerCase();
  if (m.includes('cannot reach') || m.includes('failed to fetch') || m.includes('networkerror'))
    return 'Cannot reach the backend. Check that the FastAPI server is running.';
  if (m.includes('timed out') || m.includes('timeout'))
    return 'The request timed out (60 s). The backend may be busy — please try again.';
  return msg;
}

/** Render answer text with [citation] tokens turned into highlighted spans. */
function LinkedText({ text, sourceMap, onCiteClick }) {
  if (!text) return null;
  const parts = text.split(/(\[[^\[\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\[\]]+)\]$/);
        if (m) {
          const id = m[1];
          return (
            <button
              key={i}
              className="citation-btn"
              onClick={() => onCiteClick(id)}
              title={`Jump to source: ${id}`}
              type="button"
            >
              [{id}]
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function ImpactView({ scope }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [highlighted, setHighlighted] = useState('');
  const sourcesRef = useRef(null);

  async function runImpact(customInput) {
    const query = (customInput ?? input).trim();
    if (!query || loading) return;
    setError('');
    setResult(null);
    setHighlighted('');
    setLoading(true);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timed out')), 60000)
    );

    try {
      const data = await Promise.race([getImpact(query, scope || undefined), timeout]);
      setResult(data);
    } catch (err) {
      setError(mapBackendError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleCiteClick(id) {
    setHighlighted(id);
    // Use index-based element lookup (safe for IDs with colons and #)
    const el = sourcesRef.current?.querySelector(`[data-source-id="${CSS.escape(id)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setHighlighted(''), 2000);
  }

  const sourceMap = Object.fromEntries(
    (result?.sources || []).map((s) => [s.id, s])
  );

  const byKind = { file: [], feature: [], component: [] };
  (result?.affected || []).forEach((item) => {
    (byKind[item.kind] || byKind.file).push(item);
  });

  const kindSections = [
    { kind: 'file', label: 'Files' },
    { kind: 'feature', label: 'Features / Issues' },
    { kind: 'component', label: 'Components' },
  ].filter(({ kind }) => byKind[kind].length > 0);

  return (
    <div className="impact-view">
      <div className="impact-disclaimer">
        <Info size={13} />
        Impact analysis is based on historical commit patterns in the ingested window — not a guarantee.
      </div>

      <form
        className="impact-form"
        onSubmit={(e) => { e.preventDefault(); runImpact(); }}
      >
        <div className="impact-input-wrap">
          <Search size={15} className="impact-search-icon" />
          <input
            className="impact-input"
            placeholder="File path (src/auth.py), commit SHA (c001), or change description"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!input.trim() || loading}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="impact-error">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {result && !result.found && (
        <div className="impact-not-found">
          <Info size={16} />
          <div>
            <strong>No project history found for this change.</strong>
            <p>{result.answer || 'Try a different file path, commit SHA, or description.'}</p>
          </div>
        </div>
      )}

      {result?.found && (
        <>
          {result.summary && (
            <div className="impact-summary">
              <p>{result.summary}</p>
            </div>
          )}

          {/* Candidate choices if multiple files match */}
          {result.candidates?.length > 0 && (
            <div className="impact-candidates">
              <span>Multiple matches — select a specific file:</span>
              {result.candidates.map((c) => (
                <button
                  key={c}
                  className="candidate-btn"
                  onClick={() => { setInput(c); runImpact(c); }}
                  type="button"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {kindSections.map(({ kind, label }) => (
            <div key={kind} className="impact-section">
              <div className="impact-section-label">
                {KIND_ICON[kind]} {label}
              </div>
              <div className="impact-items">
                {byKind[kind].map((item, idx) => (
                  <div key={idx} className="impact-item">
                    <div className="impact-item-top">
                      <span className="impact-item-name">{item.item}</span>
                      <span className={`conf-badge ${CONF_CLASS[item.confidence] || 'conf-low'}`}>
                        {item.confidence}
                      </span>
                    </div>
                    <div className="impact-item-reason">{item.reason}</div>
                    {item.evidence?.length > 0 && (
                      <div className="impact-evidence">
                        {item.evidence.map((eid) => (
                          <button
                            key={eid}
                            className="evidence-pill"
                            onClick={() => handleCiteClick(eid)}
                            type="button"
                            title={eid}
                          >
                            {eid.length > 40 ? '…' + eid.slice(-30) : eid}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Sources */}
          {result.sources?.length > 0 && (
            <div className="impact-sources" ref={sourcesRef}>
              <div className="impact-sources-label">Sources</div>
              {result.sources.map((s) => (
                <div
                  key={s.id}
                  data-source-id={s.id}
                  className={`impact-source-card ${highlighted === s.id ? 'highlighted' : ''}`}
                >
                  <div className="impact-source-top">
                    <span className="source-type-badge">{s.type}</span>
                    <span className="source-id">{s.id}</span>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noreferrer" className="source-link">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  {s.snippet && <p className="source-snippet">{s.snippet}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
