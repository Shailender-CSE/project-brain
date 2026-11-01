import apiRequest from './api.js';

export async function getCommits(repo = null, limit = 50) {
  const params = new URLSearchParams({ limit });
  if (repo) params.set('repo', repo);
  const data = await apiRequest(`/api/commits?${params.toString()}`);
  return data.commits || [];
}

export default { getCommits };
