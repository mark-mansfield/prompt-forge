import { useState } from 'react';
import { PasswordGate } from './components/password-gate';
import { Layout } from './components/layout';

function App() {
  const [authorized, setAuthorized] = useState(false);

  return <>{authorized ? <Layout /> : <PasswordGate onAuthorize={() => setAuthorized(true)} />}</>;
}

export default App;
