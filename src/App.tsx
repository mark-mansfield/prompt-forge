import { useLazyLoadQuery, graphql } from 'react-relay';

import { useState } from 'react';
import { PasswordGate } from './components/password-gate';
import { SplitLayout } from './components/split-layout';

const TEST_PROMPT = 'test';
const AppPromptTestQuery = graphql`
  query AppPromptTestQuery($prompt: String!, $modelA: String!, $modelB: String!) {
    testPrompt(prompt: $prompt, modelA: $modelA, modelB: $modelB) {
      modelAResponse {
        content
        model
      }
      modelBResponse {
        content
        model
      }
    }
  }
`;

function App() {
  const [authorized, setAuthorized] = useState(false);

  const data = useLazyLoadQuery(AppPromptTestQuery, {
    prompt: TEST_PROMPT,
    modelA: 'llama3.1-8b',
    modelB: 'qwen2.5-7b',
  });

  console.log('prompt', TEST_PROMPT, 'response', data);
  return (
    <>{authorized ? <SplitLayout /> : <PasswordGate onAuthorize={() => setAuthorized(true)} />}</>
  );
}

export default App;
