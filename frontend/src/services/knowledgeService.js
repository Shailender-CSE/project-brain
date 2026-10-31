import apiRequest from './api.js';

export async function getKnowledgeSources() {
  return await apiRequest('/api/knowledge/sources');
}

export async function getTaskStatus(taskId) {
  return await apiRequest(`/api/knowledge/status/${taskId}`);
}

export async function pollTaskUntilDone(taskId, onProgress, intervalMs = 1000) {
  while (true) {
    const status = await getTaskStatus(taskId);
    if (onProgress && status.progress) {
      onProgress(status.progress);
    }
    if (status.status === 'completed' || status.status === 'completed (partial)') {
      return status;
    }
    if (status.status === 'failed') {
      throw new Error(status.error || 'Indexing task failed');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiRequest('/api/knowledge/upload', {
    method: 'POST',
    body: formData,
  });

  return await pollTaskUntilDone(response.task_id, onProgress);
}

export async function connectRepository(repoUrl, onProgress) {
  const response = await apiRequest('/api/knowledge/repository', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl }),
  });

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
  pollTaskUntilDone,
  uploadDocument,
  connectRepository,
  deleteRepository,
};
