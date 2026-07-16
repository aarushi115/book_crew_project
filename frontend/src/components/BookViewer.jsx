import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { downloadBookAsPdf } from '../utils/downloadBook';

/**
 * BookViewer — renders generated chapters in a tabbed interface with markdown support
 * @param {Array<{title: string, content: string}>} chapters
 * @param {string} topic
 */
export default function BookViewer({ chapters, topic }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  const current = chapters[activeTab];

  async function handleDownloadPdf() {
    setIsDownloading(true);
    try {
      await downloadBookAsPdf(topic, chapters);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="book-viewer">
      {/* Header */}
      <div className="book-header">
        <div className="book-header-badge">
          <span>✓</span>
          <span>Generation Complete</span>
        </div>
        <h1 className="book-header-title">{topic || 'Your Generated Book'}</h1>
        <p className="book-header-meta">
          <strong>{chapters.length}</strong> chapters generated &nbsp;·&nbsp; Powered by CrewAI &amp; Gemini Flash Lite
        </p>

        <div className="book-download-actions">
          <button
            type="button"
            className="btn-download"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            <span aria-hidden="true">{isDownloading ? '⏳' : '⬇'}</span>
            {isDownloading ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <nav className="chapter-tabs-bar" role="tablist" aria-label="Book chapters">
        {chapters.map((ch, i) => (
          <button
            key={i}
            id={`tab-${i}`}
            role="tab"
            aria-selected={i === activeTab}
            aria-controls={`panel-${i}`}
            className={`chapter-tab-btn ${i === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
            title={ch.title}
          >
            Ch.{i + 1} · {ch.title.length > 28 ? ch.title.slice(0, 25) + '…' : ch.title}
          </button>
        ))}
      </nav>

      {/* Chapter content */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="chapter-card"
        key={activeTab} /* key forces re-animation on tab change */
      >
        <div className="chapter-card-number">Chapter {activeTab + 1}</div>
        <h2 className="chapter-card-title">{current.title}</h2>
        <div className="chapter-markdown">
          <ReactMarkdown>{current.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
