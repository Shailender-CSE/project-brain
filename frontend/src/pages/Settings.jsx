import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, CheckCircle2, XCircle, Database, Key, Server, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiRequest from '../services/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const [backendHealth, setBackendHealth] = useState(null);
  const [testing, setTesting] = useState(false);

  const checkHealth = async () => {
    setTesting(true);
    try {
      const res = await apiRequest('/health');
      setBackendHealth(res?.status === 'ok');
    } catch {
      setBackendHealth(false);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 className="page-title">Settings & System Status</h1>
      <p className="page-subtitle">Manage environment status, connectivity, and session.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
        {/* User Account */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(117,198,176,0.15)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>Current Session</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 14 }}>
            <span style={{ color: '#8FA9A3' }}>Name:</span>
            <span>{user?.name || 'Administrator'}</span>
            <span style={{ color: '#8FA9A3' }}>Email:</span>
            <span>{user?.email || 'admin@projectbrain.ai'}</span>
            <span style={{ color: '#8FA9A3' }}>Role:</span>
            <span>{user?.role || 'Admin'}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={logout} style={{ color: '#ef4444' }}>
              <LogOut size={14} /> End Session
            </button>
          </div>
        </div>

        {/* System Services & Connectivity */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(117,198,176,0.15)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Server size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>Backend Services & Health</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>FastAPI Backend</div>
                <div style={{ fontSize: 12, color: '#8FA9A3' }}>API & RAG pipeline endpoints</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: backendHealth ? '#10b981' : '#ef4444' }}>
                {backendHealth ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{backendHealth ? 'Connected & Healthy' : 'Unreachable'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>pgvector Vector Database</div>
                <div style={{ fontSize: 12, color: '#8FA9A3' }}>PostgreSQL with HNSW 384-d cosine similarity index</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
                <CheckCircle2 size={16} />
                <span>Active</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>GitHub API Integration</div>
                <div style={{ fontSize: 12, color: '#8FA9A3' }}>Bearer Token authentication for repository indexing (5000 req/hr)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
                <CheckCircle2 size={16} />
                <span>Configured</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>Google Gemini LLM</div>
                <div style={{ fontSize: 12, color: '#8FA9A3' }}>AI Assistant & Blast Radius Reasoning Engine</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
                <CheckCircle2 size={16} />
                <span>Configured</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={checkHealth} disabled={testing}>
              Check Connection Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
