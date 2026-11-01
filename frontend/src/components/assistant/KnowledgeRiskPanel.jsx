import { useState, useEffect } from 'react';
import { ShieldAlert, Users, GitCommit, AlertTriangle, Info, Loader2, ExternalLink, CalendarDays } from 'lucide-react';
import { getKnowledgeRisk, getRepoStats } from '../../services/assistantService.js';

const RISK_CLASS = { high: 'risk-high', medium: 'risk-medium', low: 'risk-low' };

function mapBackendError(msg) {
  if (!msg) return 'The request failed. Please try again.';
  const m = msg.toLowerCase();
  if (m.includes('cannot reach') || m.includes('failed to fetch') || m.includes('networkerror'))
    return 'Cannot reach the backend. Check that the FastAPI server is running.';
  return msg;
}

function RepoStatsCard({ repo }) {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setErr('');
    getRepoStats(repo || undefined)
      .then(setStats)
      .catch((e) => setErr(mapBackendError(e.message)))
      .finally(() => setLoading(false));
  }, [repo]);

  if (loading) return (
    <div className="risk-stats-card risk-stats-loading">
      <Loader2 size={16} className="spin" /> Loading repo stats…
    </div>
  );
  if (err) return <div className="risk-stats-card risk-error-inline"><AlertTriangle size={13} /> {err}</div>;
  if (!stats?.found) return (
    <div className="risk-stats-card risk-stats-empty">
      <Info size={13} /> {stats?.answer || 'No repository data found.'}
    </div>
  );

  return (
    <div className="risk-stats-card">
      <div className="risk-stats-title">
        <GitCommit size={14} /> Repository Overview
        {repo && <span className="risk-repo-label">{repo}</span>}
      </div>
      <div className="risk-stats-chips">
        <div className="stats-chip"><span>{stats.counts?.commits ?? 0}</span><label>Commits</label></div>
        <div className="stats-chip"><span>{stats.counts?.issues ?? 0}</span><label>Issues</label></div>
        <div className="stats-chip"><span>{stats.counts?.prs ?? 0}</span><label>PRs</label></div>
        <div className="stats-chip"><span>{stats.counts?.docs ?? 0}</span><label>Docs</label></div>
        <div className="stats-chip"><span>{stats.distinct_authors ?? 0}</span><label>Authors</label></div>
      </div>
      {stats.date_range?.first && (
        <div className="risk-stats-dates">
          <CalendarDays size={11} />
          {stats.date_range.first} → {stats.date_range.last}
        </div>
      )}
      {stats.top_authors?.length > 0 && (
        <div className="risk-top-authors">
          <span className="risk-top-label">Top authors:</span>
          {stats.top_authors.map((a) => (
            <span key={a.author} className="author-chip">{a.author} ({a.commits})</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeRiskPanel({ scope }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Require a repo to be selected for risk panel
  const repoRequired = !scope;

  useEffect(() => {
    if (repoRequired) { setData(null); setError(''); return; }
    setLoading(true);
    setError('');
    setData(null);
    getKnowledgeRisk(scope)
      .then(setData)
      .catch((e) => setError(mapBackendError(e.message)))
      .finally(() => setLoading(false));
  }, [scope, repoRequired]);

  const busFactor = data?.bus_factor_note || '';
  const isBusCritical = busFactor.includes('WARNING') || busFactor.includes('1 distinct author');
  const isBusWarn = !isBusCritical && (busFactor.includes('Low bus factor') || busFactor.includes('2 distinct'));

  return (
    <div className="risk-panel">
      {/* Repo-stats header card — always shown */}
      <RepoStatsCard repo={scope || undefined} />

      {repoRequired && (
        <div className="risk-prompt">
          <ShieldAlert size={20} />
          <div>
            <strong>Select a repository</strong>
            <p>Use the Scope selector above to choose a specific repository to analyze knowledge risk.</p>
          </div>
        </div>
      )}

      {!repoRequired && loading && (
        <div className="risk-loading">
          <Loader2 size={16} className="spin" /> Analyzing knowledge risk…
        </div>
      )}

      {!repoRequired && error && (
        <div className="risk-error">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Bus factor banner */}
      {data?.found && busFactor && (
        <div className={`bus-factor-banner ${isBusCritical ? 'bus-critical' : isBusWarn ? 'bus-warn' : 'bus-ok'}`}>
          <Users size={14} /> {busFactor}
        </div>
      )}

      {/* History window */}
      {data?.history_window && (
        <div className="risk-window-card">
          <Info size={12} />
          Analyzing <strong>{data.history_window.commits_analyzed}</strong> commits
          ({data.history_window.first_date} to {data.history_window.last_date})
        </div>
      )}

      {data && !data.found && (
        <div className="risk-empty">
          <ShieldAlert size={18} />
          <div>{data.answer || 'No sole-author files found in the ingested history window.'}</div>
          {data.note && <p className="risk-note">{data.note}</p>}
        </div>
      )}

      {data?.found && data.files?.length > 0 && (
        <>
          {data.summary && <div className="risk-summary"><p>{data.summary}</p></div>}

          <div className="risk-table">
            <div className="risk-table-head">
              <div>File</div>
              <div>Sole Author</div>
              <div>Commits</div>
              <div>Last Changed</div>
              <div>Risk</div>
              <div>Evidence</div>
            </div>
            {data.files.map((f, i) => (
              <div key={i} className="risk-table-row">
                <div className="risk-file">{f.file}</div>
                <div className="risk-author">{f.sole_author}</div>
                <div className="risk-commits">{f.commits}</div>
                <div className="risk-date">{f.last_changed}</div>
                <div>
                  <span className={`risk-badge ${RISK_CLASS[f.risk_level] || 'risk-low'}`}>
                    {f.risk_level}
                  </span>
                </div>
                <div className="risk-evidence-pills">
                  {(f.evidence || []).slice(0, 3).map((eid) => (
                    <a
                      key={eid}
                      className="evidence-pill"
                      title={eid}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      {eid.includes(':commit:') ? eid.split(':commit:')[1] : eid.slice(-8)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {data.note && <p className="risk-note">{data.note}</p>}
        </>
      )}
    </div>
  );
}
