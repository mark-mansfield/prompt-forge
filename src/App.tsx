import { useEffect, useState } from 'react';
import { PasswordGate } from './components/password-gate';
import { Layout } from './components/layout';

function App() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/auth/employer', { method: 'GET', credentials: 'include' });
        const data = (await res.json().catch(() => null)) as { authorized?: boolean } | null;
        if (!cancelled) setAuthorized(Boolean(data?.authorized));
      } catch {
        if (!cancelled) setAuthorized(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div role="status" aria-live="polite">
          Checking session…
        </div>
      </div>
    );
  }

  return <>{authorized ? <Layout /> : <PasswordGate onAuthorize={() => setAuthorized(true)} />}</>;
}

export default App;
