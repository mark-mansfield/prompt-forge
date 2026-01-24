import {
  Environment,
  Network,
  RecordSource,
  Store,
  type RequestParameters,
  type Variables,
} from 'relay-runtime';
import type { AppPromptTestQuery$data } from './__generated__/AppPromptTestQuery.graphql';

async function fetchQuery(params: RequestParameters, variables: Variables) {
  console.log('📡 Mock fetchQuery:', params.name, variables);

  // Your existing mock data (works perfectly)
  const mockData: AppPromptTestQuery$data = {
    testPrompt: {
      modelAResponse: {
        content: "Mock Llama3.1: Here's your response.",
        model: 'llama3.1-8b',
      },
      modelBResponse: {
        content: "Mock Qwen2.5: Certainly, here's yours.",
        model: 'qwen2.5-7b',
      },
    },
  };

  return { data: mockData };
}

function createRelayEnvironment() {
  return new Environment({
    network: Network.create(fetchQuery),
    store: new Store(new RecordSource()),
  });
}

export const RelayEnvironment = createRelayEnvironment();
