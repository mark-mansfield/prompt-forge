import { useState } from 'react';

interface PasswordGateProps {
  onAuthorize: () => void;
}

export function PasswordGate({ onAuthorize }: PasswordGateProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const canSubmit = !loading && passcode.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/auth/employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: passcode }),
      });

      if (res.ok) {
        onAuthorize();
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? 'Login failed');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPasscode ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              autoFocus
              disabled={loading}
              className="w-full pr-20 px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
            />
            <button
              aria-label="Toggle password visibility"
              title={showPasscode ? 'Hide password' : 'Show password'}
              aria-pressed={showPasscode}
              type="button"
              onClick={() => setShowPasscode((v) => !v)}
              disabled={loading}
              className={[
                'absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded',
                loading
                  ? 'cursor-not-allowed opacity-60 text-slate-300'
                  : 'text-slate-200 hover:text-white',
              ].join(' ')}
            >
              {showPasscode ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                'px-6 py-2 text-white rounded transition-colors',
                canSubmit
                  ? 'bg-slate-600 hover:bg-slate-500 cursor-pointer'
                  : 'bg-slate-700 cursor-not-allowed opacity-60',
              ].join(' ')}
            >
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
