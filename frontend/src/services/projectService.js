/**
 * projectService.js — real backend-backed project service.
 *
 * Projects are stored in the browser's localStorage and synced with the
 * knowledge sources from the backend. The "sync" action triggers a real
 * repository ingestion via the backend API.
 */
import apiRequest from './api.js';

const STORAGE_KEY = 'pb_projects_v2';

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function getProjects() {
  const local = loadLocal();

  // Enrich projects with real stats from the backend knowledge sources
  try {
    const sources = await apiRequest('/api/knowledge/sources');
    const repos = sources.repositories || [];
    const docs = sources.documents || [];

    // Update existing projects with real counts where repo names match
    const enriched = local.map((p) => {
      const matchingRepo = repos.find((r) =>
        r.name?.toLowerCase().includes(p.name?.toLowerCase()) ||
        p.name?.toLowerCase().includes(r.name?.toLowerCase())
      );
      if (matchingRepo) {
        return {
          ...p,
          repositories: 1,
          commits: matchingRepo.commits || 0,
          status: 'synced',
          lastSynced: matchingRepo.lastSynced || p.lastSynced,
          indexingProgress: 100,
        };
      }
      return p;
    });

    // If backend has repos not in local list, add them as auto-discovered projects
    for (const repo of repos) {
      const exists = enriched.some(
        (p) => p.name?.toLowerCase() === repo.name?.toLowerCase() ||
               p.repoUrl === repo.name
      );
      if (!exists) {
        enriched.push({
          id: `auto-${repo.name.replace(/\//g, '-')}-${Date.now()}`,
          name: repo.name,
          description: `Auto-discovered from indexed repository ${repo.name}`,
          icon: 'folder',
          status: 'synced',
          repositories: 1,
          documents: repo.docs || 0,
          commits: repo.commits || 0,
          lastSynced: repo.lastSynced || 'Recently',
          indexingProgress: 100,
          repoUrl: repo.name,
          repoPrefix: repo.id,
        });
      }
    }

    saveLocal(enriched);
    return enriched;
  } catch (e) {
    // Backend unreachable — return local-only data
    return local;
  }
}

export async function getProject(id) {
  const list = loadLocal();
  const project = list.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
}

export async function createProject(data) {
  const list = loadLocal();
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');
  const duplicate = list.some((p) => p.name.trim().toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error('A project with this name already exists');

  const project = {
    id: `project-${Date.now()}`,
    name,
    description: (data.description || '').trim(),
    icon: data.icon || 'folder',
    status: 'attention',
    repositories: 0,
    documents: 0,
    commits: 0,
    lastSynced: 'Never',
    indexingProgress: 0,
  };
  list.unshift(project);
  saveLocal(list);
  return project;
}

export async function updateProject(id, data) {
  const list = loadLocal();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');
  const duplicate = list.some((p) => p.id !== id && p.name.trim().toLowerCase() === name.toLowerCase());
  if (duplicate) throw new Error('A project with this name already exists');
  const updated = {
    ...list[idx],
    name,
    description: (data.description || '').trim(),
    status: data.status || list[idx].status,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  saveLocal(list);
  return updated;
}

export async function archiveProject(id) {
  const list = loadLocal();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  list[idx] = { ...list[idx], status: 'Archived', updatedAt: new Date().toISOString() };
  saveLocal(list);
  return list[idx];
}

export async function deleteProject(id) {
  const list = loadLocal();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  list.splice(idx, 1);
  saveLocal(list);
  return true;
}

/**
 * syncProject — trigger a real backend ingestion for a project's repository.
 * Returns a task_id that the caller can poll via knowledgeService.getTaskStatus.
 */
export async function syncProject(project) {
  const repoUrl = project.repoUrl || project.name;
  if (!repoUrl) throw new Error('No repository URL configured for this project.');
  const result = await apiRequest('/api/knowledge/repository', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  return result; // { task_id, status, message }
}

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  syncProject,
};
