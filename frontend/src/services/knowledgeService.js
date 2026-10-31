import apiRequest from './api.js';

export async function getKnowledgeSources() {
  return await apiRequest('/api/knowledge/sources');
}

export async function getTaskStatus(taskId) {
  return await apiRequest(`/api/knowledge/status/${taskId}`);
}

/**
 * Start a document upload and return {task_id} immediately.
 * The caller is responsible for polling via getTaskStatus.
 * FormData is passed directly — api.js skips Content-Type for FormData.
 */
export async function startDocumentUpload(file) {
  const formData = new FormData();
  formData.append('file', file);
  return await apiRequest('/api/knowledge/upload', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Start a repository ingestion and return {task_id} immediately.
 */
export async function startRepositoryConnect(repoUrl) {
  return await apiRequest('/api/knowledge/repository', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl }),
  });
}

/** Legacy blocking version — kept for any remaining callers. */
export async function pollTaskUntilDone(taskId, onProgress, intervalMs = 2000) {
  while (true) {
    const status = await getTaskStatus(taskId);
    if (onProgress && status.progress) onProgress(status.progress);
    if (status.status === 'completed' || status.status === 'completed (partial)') return status;
    if (status.status === 'failed') throw new Error(status.error || 'Indexing task failed');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Legacy wrappers — kept so existing import paths don't break. */
export async function uploadDocument(file, onProgress) {
  const response = await startDocumentUpload(file);
  return await pollTaskUntilDone(response.task_id, onProgress);
}

export async function connectRepository(repoUrl, onProgress) {
  const response = await startRepositoryConnect(repoUrl);
  return await pollTaskUntilDone(response.task_id, onProgress);
}

export async function deleteRepository(prefix) {
  return await apiRequest('/api/knowledge/reset', {
    method: 'DELETE',
    body: JSON.stringify({ prefix }),
  });
}

export default {
  getKnowledgeSources,
  getTaskStatus,
  startDocumentUpload,
  startRepositoryConnect,
  pollTaskUntilDone,
  uploadDocument,
  connectRepository,
  deleteRepository,
};
