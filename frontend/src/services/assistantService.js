import apiRequest from './api.js';

export async function askQuestion(question) {
  try {
    return await apiRequest('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Could not connect to the backend. Start the FastAPI server and check frontend/.env.',
      );
    }
    throw error;
  }
}

export async function getConversations() {
  return [];
}

export default { askQuestion, getConversations };
