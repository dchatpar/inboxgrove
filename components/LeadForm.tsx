import React, { useState } from 'react';

type LeadFormProps = {
  compact?: boolean;
  onSuccess?: () => void;
};

const LeadForm: React.FC<LeadFormProps> = ({ compact = false, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) {
      setError('Please enter a valid work email.');
      return;
    }
    setSubmitting(true);
    try {
      // Stub: Replace with your backend or form provider endpoint
      // Example: await fetch('/api/leads', { method: 'POST', body: JSON.stringify({ email, company, useCase }) })
      const payload = { email, company, useCase, ts: Date.now() };
      localStorage.setItem('lead:last', JSON.stringify(payload));
      await new Promise((r) => setTimeout(r, 600));
      setSuccess(true);
      onSuccess?.();
      setEmail('');
      setCompany('');
      setUseCase('');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success && compact) {
    return (
      <p className="text-sm text-emerald-400 font-semibold" role="status" aria-live="polite">
        Thanks! We’ll reach out shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'w-full' : 'max-w-xl mx-auto'} aria-label="Lead capture form">
      <div className={compact ? 'flex gap-2 items-stretch' : 'grid grid-cols-1 gap-3'}>
        <label className="sr-only" htmlFor="lead-email">Work email</label>
        <input
          id="lead-email"
          type="email"
          required
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-invalid={!!error && !validateEmail(email)}
        />

        {!compact && (
          <>
            <label className="sr-only" htmlFor="lead-company">Company</label>
            <input
              id="lead-company"
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <label className="sr-only" htmlFor="lead-usecase">Use case</label>
            <input
              id="lead-usecase"
              type="text"
              placeholder="Use case (optional)"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`whitespace-nowrap rounded-lg px-5 ${compact ? 'py-3' : 'py-3.5'} font-bold text-white bg-brand-600 hover:bg-brand-500 border border-brand-500 shadow-lg shadow-brand-600/20 transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          aria-label="Submit lead form"
        >
          {submitting ? 'Submitting…' : compact ? 'Get Demo' : 'Request Demo'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-400" role="alert">{error}</p>
      )}
      {success && !compact && (
        <p className="mt-3 text-sm text-emerald-400 font-semibold" role="status" aria-live="polite">
          Thanks! We’ll reach out shortly.
        </p>
      )}
    </form>
  );
};

export default LeadForm;
