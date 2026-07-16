import { useState } from 'react';

/**
 * BookForm — sidebar form for collecting topic and goal inputs
 */
export default function BookForm({ onSubmit, isLoading }) {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [touched, setTouched] = useState({ topic: false, goal: false });

  const topicEmpty = touched.topic && !topic.trim();
  const goalEmpty = touched.goal && !goal.trim();

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ topic: true, goal: true });
    if (!topic.trim() || !goal.trim()) return;
    onSubmit(topic.trim(), goal.trim());
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="sidebar-label">Book Configuration</div>

      <div className="form-group">
        <label className="form-label" htmlFor="book-topic">
          Book Topic
        </label>
        <input
          id="book-topic"
          className="form-input"
          type="text"
          placeholder="e.g., Explainable AI in Medical Diagnostics"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, topic: true }))}
          disabled={isLoading}
          aria-invalid={topicEmpty}
          aria-describedby={topicEmpty ? 'topic-error' : undefined}
        />
        {topicEmpty && (
          <p id="topic-error" style={{ color: 'var(--accent-error)', fontSize: '12px', marginTop: '6px' }}>
            Topic is required.
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="book-goal">
          Objective &amp; Target Audience
        </label>
        <textarea
          id="book-goal"
          className="form-textarea"
          placeholder="e.g., Write a 10-page technical introduction for senior undergraduates studying computer science."
          value={goal}
          onChange={e => setGoal(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, goal: true }))}
          disabled={isLoading}
          aria-invalid={goalEmpty}
          aria-describedby={goalEmpty ? 'goal-error' : undefined}
        />
        {goalEmpty && (
          <p id="goal-error" style={{ color: 'var(--accent-error)', fontSize: '12px', marginTop: '6px' }}>
            Objective is required.
          </p>
        )}
      </div>

      <button
        id="generate-book-btn"
        type="submit"
        className="btn-generate"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            Agents Working…
          </>
        ) : (
          <>
            ✨ Generate Book
          </>
        )}
      </button>
    </form>
  );
}
