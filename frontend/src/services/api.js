const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'
).replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const body = JSON.parse(text);
      message = body.detail || body.message || text;
    } catch {
      // Keep response text if not JSON
    }
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export default apiRequest;
