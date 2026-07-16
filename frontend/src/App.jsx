import { useState } from 'react';
import BookForm from './components/BookForm';
import LoadingScreen from './components/LoadingScreen';
import BookViewer from './components/BookViewer';
import { generateBook } from './api/bookApi';
import './index.css';

/**
 * App — root component orchestrating the three UI states:
 *   idle → loading → result (or error)
 */
export default function App() {
  const [status, setStatus]   = useState('idle');   // 'idle' | 'loading' | 'success' | 'error'
  const [chapters, setChapters] = useState([]);
  const [topic, setTopic]     = useState('');
  const [error, setError]     = useState('');

  async function handleGenerate(submittedTopic, goal) {
    setTopic(submittedTopic);
    setStatus('loading');
    setError('');
    setChapters([]);

    try {
      const result = await generateBook(submittedTopic, goal);
      setChapters(result);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  const isLoading = status === 'loading';

  return (
    <>
      {/* Animated background */}
      <div className="stars-bg" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <div className="app-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar" aria-label="Book configuration">
          {/* Logo / branding */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon" aria-hidden="true">📚</div>
            <div className="sidebar-logo-text">
              <h1>AI Book Writer</h1>
              <p>Studio</p>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Form */}
          <BookForm onSubmit={handleGenerate} isLoading={isLoading} />

          {/* Bottom hint */}
          <div className="sidebar-hint">
            Powered by <strong>CrewAI Flows</strong> &amp; <strong>Gemini Flash Lite</strong>.
            <br />Generation may take <strong>2–5 minutes</strong>.
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="main-content">
          {/* Error banner */}
          {status === 'error' && (
            <div className="error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <strong>Generation Failed</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* State: idle welcome */}
          {(status === 'idle' || status === 'error') && (
            <div className="hero-state">
              <div className="hero-icon" aria-hidden="true">✍️</div>
              <h2 className="hero-title">Write Your Book with AI</h2>
              <p className="hero-subtitle">
                Fill in the sidebar with your book topic and objective. A crew of specialized AI agents
                will outline, research, and write each chapter — end to end.
              </p>

              <div className="feature-grid">
                <div className="feature-card">
                  <span className="feature-card-icon" aria-hidden="true">🗂️</span>
                  <div className="feature-card-title">Outline First</div>
                  <div className="feature-card-desc">Structure is planned before any writing begins</div>
                </div>
                <div className="feature-card">
                  <span className="feature-card-icon" aria-hidden="true">🤖</span>
                  <div className="feature-card-title">Multi-Agent</div>
                  <div className="feature-card-desc">Specialized agents handle each writing task</div>
                </div>
                <div className="feature-card">
                  <span className="feature-card-icon" aria-hidden="true">📖</span>
                  <div className="feature-card-title">Full Chapters</div>
                  <div className="feature-card-desc">Complete, readable chapters — not bullet points</div>
                </div>
              </div>
            </div>
          )}

          {/* State: loading */}
          {status === 'loading' && <LoadingScreen topic={topic} />}

          {/* State: success */}
          {status === 'success' && (
            <BookViewer chapters={chapters} topic={topic} />
          )}
        </main>
      </div>
    </>
  );
}
