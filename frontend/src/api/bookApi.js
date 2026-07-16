/**
 * bookApi.js
 * Thin wrapper around the FastAPI /generate-book endpoint.
 * Vite proxies /generate-book → http://127.0.0.1:8000/generate-book
 */

const API_TIMEOUT_MS = 600_000; // 10 minutes — agents can take a while

/**
 * @param {string} topic
 * @param {string} goal
 * @returns {Promise<Array<{title: string, content: string}>>}
 */
export async function generateBook(topic, goal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch('/generate-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, goal }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = 'Unknown error occurred.';
      try {
        const err = await response.json();
        detail = err.detail || detail;
      } catch (_) {}
      throw new Error(detail);
    }

    const data = await response.json();
    return data.book || [];
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The agents may still be working — please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
