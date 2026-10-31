import { mockProjects } from '../data/mockProjects';

const STORAGE_KEY = 'pb_projects';
const DELAY = 500;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProjects));
  return [...mockProjects];
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function delay(ms = DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getProjects() {
  await delay();
  return load();
}

export async function getProject(id) {
  await delay(200);
  const list = load();
  const project = list.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
}

export async function createProject(data) {
  await delay();
  const list = load();
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');
  const duplicate = list.some(
    (p) => p.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) throw new Error('A project with this name already exists');
  const now = new Date().toISOString();
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
  save(list);
  return project;
}

export async function updateProject(id, data) {
  await delay();
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  const name = (data.name || '').trim();
  if (!name) throw new Error('Project name is required');
  const duplicate = list.some(
    (p) => p.id !== id && p.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) throw new Error('A project with this name already exists');
  const updated = {
    ...list[idx],
    name,
    description: (data.description || '').trim(),
    status: data.status || list[idx].status,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  save(list);
  return updated;
}

export async function archiveProject(id) {
  await delay();
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  list[idx] = { ...list[idx], status: 'Archived', updatedAt: new Date().toISOString() };
  save(list);
  return list[idx];
}

export async function deleteProject(id) {
  await delay();
  const list = load();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  list.splice(idx, 1);
  save(list);
  return true;
}

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
};
