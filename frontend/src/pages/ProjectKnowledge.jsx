import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, GitCommit, ArrowRight, RefreshCw, Github, AlertTriangle, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as projectService from '../services/projectService';
import { getCommits } from '../services/commitService';
import { getRepoStats, getKnowledgeRisk } from '../services/assistantService';

export default function ProjectKnowledge() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [commits, setCommits] = useState([]);
  const [stats, setStats] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let p = null;
        if (projectId) {
          try {
            p = await projectService.getProject(projectId);
            setProject(p);
          } catch {
            // Check if projectId is a repo or fallback
          }
        }
        
        const repoName = p?.repoUrl || p?.name;
        // Fetch real commits for this project
        const commitList = await getCommits(repoName, 10).catch(() => []);
        setCommits(commitList);

        if (repoName) {
          const s = await getRepoStats(repoName).catch(() => null);
          setStats(s);
          const r = await getKnowledgeRisk(repoName).catch(() => null);
          setRiskData(r);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const repoDisplay = project?.repoUrl || project?.name || 'Project';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: 4 }}>
            PROJECT MEMORY & KNOWLEDGE
          </div>
          <h1 className="page-title">{project ? project.name : (projectId ? `Project ${projectId}` : 'Project Knowledge')}</h1>
          <p className="page-subtitle">
            {project?.description || `Context, commit history, and knowledge health for ${repoDisplay}.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/assistant')}>
            <ArrowRight size={14} /> Ask Brain AI
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 32, color: '#8FA9A3' }}>
          <Loader2 size={20} className="spin" /> Loading project knowledge…
        </div>
      )}

      {!loading && (
        <>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Commits Ingested</div>
              <div className="stat-value">{stats?.counts?.commits ?? commits.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pull Requests</div>
              <div className="stat-value">{stats?.counts?.prs ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Issues Tracked</div>
              <div className="stat-value">{stats?.counts?.issues ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Authors</div>
              <div className="stat-value">{stats?.distinct_authors ?? '—'}</div>
            </div>
          </div>

          {/* Bus Factor / Knowledge Risk Alert */}
          {riskData?.files && riskData.files.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>
                <AlertTriangle size={16} /> Knowledge-at-Risk Warning (Bus Factor)
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
                {riskData.summary || `${riskData.files.length} critical files have only a single active author in the indexed history window.`}
              </p>
            </div>
          )}

          {/* Recent Commits for this project */}
          <div style={{ background: 'var(--surface)', border: '1px solid rgba(117,198,176,0.15)', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <GitCommit size={16} style={{ color: 'var(--primary)' }} />
                <span>Recent Ingested Commits</span>
              </div>
              <button className="btn btn-ghost" onClick={() => navigate('/commits')}>
                View all commits <ArrowRight size={13} />
              </button>
            </div>

            {commits.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#8FA9A3', fontSize: 13 }}>
                No commits ingested for this project yet. Connect the repository in Knowledge Sources to sync history.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {commits.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.message}</div>
                      <div style={{ fontSize: 11, color: '#8FA9A3', marginTop: 2 }}>
                        {c.author} · <code style={{ color: 'var(--primary)' }}>{c.hash}</code>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#8FA9A3' }}>{c.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
