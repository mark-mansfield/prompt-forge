import { Environment, Network, RecordSource, Store } from 'relay-runtime';

import type { RequestParameters, Variables } from 'relay-runtime';

export const relayEnvironment = new Environment({
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource()),
});

// ✅ Proper Relay + PromptForge types
async function fetchQuery(params: RequestParameters, variables: Variables) {
  console.log('📡 Mock fetchQuery:', params.name, variables);

  const mockData: PromptTestResponse = {
    testPrompt: {
      modelAResponse: {
        content: "Mock Llama3.1: Here's a concise, professional response.",
        model: 'llama3.1-8b',
      },
      modelBResponse: {
        content: "Mock Qwen2.5: Certainly, here's your detailed response.",
        model: 'qwen2.5-7b',
      },
    },
  };

  await new Promise((r) => setTimeout(r, Math.random() * 600 + 200));
  return { data: mockData };
}

// ✅ PromptForge response shape
interface ModelResponse {
  content: string;
  model: string;
}

interface PromptTestResponse {
  testPrompt: {
    modelAResponse: ModelResponse;
    modelBResponse: ModelResponse;
  };
}
