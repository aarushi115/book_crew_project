import { useEffect, useState } from 'react';

const STEPS = [
  { id: 'outline', label: 'Outlining book structure…' },
  { id: 'write',   label: 'Writing chapters…' },
  { id: 'review',  label: 'Reviewing content…' },
  { id: 'compile', label: 'Compiling final book…' },
];

// Simulated step progression — actual step timing is unknown from the API
const STEP_DURATIONS = [18000, 60000, 90000, 30000]; // ms per step

/**
 * LoadingScreen — full-area animated state while agents generate the book
 */
export default function LoadingScreen({ topic }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let stepIdx = 0;
    const advance = () => {
      stepIdx++;
      if (stepIdx < STEPS.length - 1) {
        setActiveStep(stepIdx);
        setTimeout(advance, STEP_DURATIONS[stepIdx]);
      } else {
        setActiveStep(STEPS.length - 1);
      }
    };
    const t = setTimeout(advance, STEP_DURATIONS[0]);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      {/* Spinning ring animation */}
      <div className="loading-ring" aria-hidden="true">
        <div className="loading-ring-track" />
        <div className="loading-ring-fill" />
        <div className="loading-ring-fill-2" />
        <div className="loading-ring-icon">📚</div>
      </div>

      <h2 className="loading-title">Agents at Work</h2>
      <p className="loading-subtitle">
        Your crew of AI agents is crafting a book on{' '}
        <strong style={{ color: 'var(--text-accent)' }}>"{topic}"</strong>.
        <br />This usually takes 2–5 minutes.
      </p>

      {/* Step tracker */}
      <div className="loading-steps" aria-label="Generation progress">
        {STEPS.map((step, i) => {
          const state =
            i < activeStep ? 'done' :
            i === activeStep ? 'active' : 'pending';
          return (
            <div
              key={step.id}
              className={`loading-step ${state}`}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <div className="step-dot" aria-hidden="true" />
              {state === 'done' ? '✓ ' : ''}{step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
