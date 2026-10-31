import apiRequest from './api.js';

export async function askQuestion(question) {
  try {
    return await apiRequest('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the backend. Check that the FastAPI server is running.');
    }
    throw error;
  }
}

export async function getImpact(input, repo) {
  try {
    const body = { input };
    if (repo) body.repo = repo;
    return await apiRequest('/assistant/impact', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the backend. Check that the FastAPI server is running.');
    }
    throw error;
  }
}

export async function getKnowledgeRisk(repo) {
  try {
    const params = repo ? `?repo=${encodeURIComponent(repo)}` : '';
    return await apiRequest(`/assistant/knowledge-risk${params}`);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the backend. Check that the FastAPI server is running.');
    }
    throw error;
  }
}

export async function getRepoStats(repo) {
  try {
    const params = repo ? `?repo=${encodeURIComponent(repo)}` : '';
    return await apiRequest(`/assistant/repo-stats${params}`);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the backend. Check that the FastAPI server is running.');
    }
    throw error;
  }
}

export async function getConversations() {
  return [];
}

export default { askQuestion, getImpact, getKnowledgeRisk, getRepoStats, getConversations };
