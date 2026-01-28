import {
  Environment,
  Network,
  RecordSource,
  Store,
  type RequestParameters,
  type Variables,
} from 'relay-runtime';

import { setActiveTabId } from './relay/ui-state';

async function fetchQuery(params: RequestParameters, variables: Variables) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY');
  }
  if (!params.text) {
    throw new Error(`Relay request missing text for operation: ${params.name}`);
  }

  const response = await fetch(`${supabaseUrl}/graphql/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `GraphQL request failed (${response.status} ${response.statusText})${errorText ? `: ${errorText}` : ''}`
    );
  }
  return response.json();
  // console.log('📡 Mock fetchQuery:', params.name, variables);

  // // Your existing mock data (works perfectly)
  // const mockData = {
  //   testPrompt: {
  //     modelAResponse: {
  //       content: "Mock Llama3.1: Here's your response.",
  //       model: 'llama3.1-8b',
  //     },
  //     modelBResponse: {
  //       content: "Mock Qwen2.5: Certainly, here's yours.",
  //       model: 'qwen2.5-7b',
  //     },
  //   },
  // };

  // return { data: mockData };
}

function createRelayEnvironment() {
  const environment = new Environment({
    network: Network.create(fetchQuery),
    store: new Store(new RecordSource()),
  });
  setActiveTabId(environment, 'all');
  return environment;
}

export const RelayEnvironment = createRelayEnvironment();
