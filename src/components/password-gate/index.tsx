import { useState } from 'react';

interface PasswordGateProps {
  onAuthorize: () => void;
}

export function PasswordGate({ onAuthorize }: PasswordGateProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Replace with actual API call
    // try {
    //   const res = await fetch('/api/graphql', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'x-passcode': passcode
    //     },
    //     body: JSON.stringify({ query: '{ __typename }' })
    //   });

    //   if (res.ok) {
    //     onAuthorize();
    //   } else {
    //     setError('Invalid passcode');
    //   }
    // } catch {
    //   setError('Network error');
    // }

    // Dummy response - always authorize
    onAuthorize();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            autoFocus
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
