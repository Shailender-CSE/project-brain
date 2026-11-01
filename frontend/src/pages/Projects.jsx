import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Grid, List, RefreshCw, FolderKanban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import ProjectGrid from '../components/projects/ProjectGrid';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import RemoveProjectModal from '../components/projects/RemoveProjectModal';
import ProjectDetailsModal from '../components/projects/ProjectDetailsModal';
import { syncProject } from '../services/projectService.js';
import { getTaskStatus } from '../services/knowledgeService.js';
import './Projects.css';

export default function Projects() {
  const { isAdmin } = useAuth();
  const { projects, loading, error, fetchProjects, createProject, deleteProject, setProjects } = useProjects();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [importOpen, setImportOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [detailsProject, setDetailsProject] = useState(null);
  const [syncingIds, setSyncingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [projects, search]);

  const handleSync = async (project) => {
    if (syncingIds.has(project.id) || project.status === 'processing') return;

    // Check if we have a real repo to sync
    const repoUrl = project.repoUrl || project.name;
    const looksLikeRepo = repoUrl && (repoUrl.includes('/') || repoUrl.includes('github.com'));

    if (!looksLikeRepo) {
      showToast('No repository URL set. Go to Knowledge Sources to add one.', 'error');
      return;
    }

    setSyncingIds((prev) => new Set(prev).add(project.id));
    setProjects((prev) => prev.map((p) =>
      p.id === project.id ? { ...p, status: 'processing', indexingProgress: 5, lastSynced: 'Syncing…' } : p
    ));

    try {
      const { task_id } = await syncProject(project);

      // Poll task status until done
      let done = false;
      let progress = 10;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        progress = Math.min(progress + 15, 90);
        setProjects((prev) => prev.map((p) =>
          p.id === project.id ? { ...p, indexingProgress: progress } : p
        ));
        try {
          const status = await getTaskStatus(task_id);
          if (status.status === 'completed' || status.status === 'completed (partial)') {
            done = true;
            const chunks = status.chunks_ingested || 0;
            setProjects((prev) => prev.map((p) =>
              p.id === project.id ? {
                ...p, status: 'synced', indexingProgress: 100,
                lastSynced: 'Just now', commits: (p.commits || 0) + chunks,
              } : p
            ));
            showToast(`Sync complete: ${chunks} items indexed from ${repoUrl}`, 'success');
          } else if (status.status === 'failed') {
            done = true;
            throw new Error(status.error || 'Indexing failed');
          }
        } catch (pollErr) {
          if (pollErr.message?.includes('Indexing')) throw pollErr;
          // Network hiccup — keep polling
        }
      }
    } catch (e) {
      setProjects((prev) => prev.map((p) =>
        p.id === project.id ? { ...p, status: 'attention', indexingProgress: 0 } : p
      ));
      showToast(e.message || 'Sync failed. Check backend logs.', 'error');
    } finally {
      setSyncingIds((prev) => { const n = new Set(prev); n.delete(project.id); return n; });
    }
  };

  const handleImport = async (data) => {
    const created = await createProject(data);
    showToast('Project created successfully', 'success');
    if (data.repoUrl) {
      handleSync(created);
    }
  };

  const handleSyncAll = async () => {
    for (const p of projects) {
      if (!syncingIds.has(p.id)) await handleSync(p);
    }
  };

  const handleExplore = (project) => navigate(`/project-knowledge/${project.id}`);
  const handleAskBrain = () => navigate('/assistant');
  const handleViewDetails = (project) => setDetailsProject(project);
  const handleRemoveRequest = (project) => setRemoveTarget(project);

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await deleteProject(removeTarget.id);
      showToast('Project removed from Brain AI', 'success');
      setRemoveTarget(null);
    } catch (e) {
      showToast(e.message || 'Failed to remove', 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div className="projects-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="projects-header">
        <div className="projects-heading">
          <div className="projects-eyebrow">YOUR DELIVERY MEMORY</div>
          <h1 className="projects-title">Projects</h1>
          <p className="projects-subtitle">Connected repositories, memory health, and the context behind every release.</p>
        </div>
        <button className="btn btn-primary create-project-btn" onClick={() => setImportOpen(true)}>
          <Plus size={14} /> Create project
        </button>
      </div>

      <div className="projects-toolbar">
        <div className="projects-search">
          <Search size={13} />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="projects-toolbar-right">
          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="Grid view"><Grid size={13} /></button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="List view"><List size={13} /></button>
          </div>
          <button className="sync-all-btn" onClick={handleSyncAll}><RefreshCw size={13} /> Sync all</button>
        </div>
      </div>

      {loading && (
        <div className="project-grid">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <RefreshCw size={32} />
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProjects} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <FolderKanban size={40} />
          <h3>{projects.length === 0 ? 'No projects yet' : 'No matching projects'}</h3>
          <p>{projects.length === 0 ? 'Create a project to get started.' : 'Try adjusting your search.'}</p>
          {projects.length === 0 && (
            <button className="btn btn-primary" onClick={() => setImportOpen(true)} style={{ marginTop: 12 }}>
              <Plus size={16} /> Create project
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ProjectGrid
          projects={filtered}
          viewMode={viewMode}
          onExplore={handleExplore}
          onAskBrain={handleAskBrain}
          onViewDetails={handleViewDetails}
          onRemove={handleRemoveRequest}
          onConnectRepository={() => setImportOpen(true)}
          syncingIds={syncingIds}
          onSync={handleSync}
        />
      )}

      <CreateProjectModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={handleImport}
        existingNames={projects.map((p) => p.name)}
      />

      <RemoveProjectModal
        isOpen={!!removeTarget}
        project={removeTarget}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
        loading={removing}
      />

      <ProjectDetailsModal
        isOpen={!!detailsProject}
        onClose={() => setDetailsProject(null)}
        project={detailsProject}
      />

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </motion.div>
  );
}
