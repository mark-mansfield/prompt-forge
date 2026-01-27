import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'sync-fetch';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Run via "node --env-file=.env ./scripts/fetch-schema.js" or export it in your shell.`
    );
  }
  return value;
}

const SUPABASE_URL_BASE = requiredEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = requiredEnv('VITE_SUPABASE_ANON_KEY');

const SUPABASE_GRAPHQL_URL = `${SUPABASE_URL_BASE.replace(/\/+$/, '')}/graphql/v1`;

function updateSchema() {
  console.log('Fetching schema from Supabase...');

  const response = fetch(SUPABASE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  });

  if (!response.ok) {
    throw new Error(`Schema fetch failed: ${response.status} ${response.statusText}`);
  }

  const { data, errors } = response.json();
  if (errors?.length) {
    throw new Error(`Schema fetch returned errors:\n${JSON.stringify(errors, null, 2)}`);
  }

  const schema = buildClientSchema(data);
  const schemaString = printSchema(schema);

  /**
   * RELAY NOTE
   * Supabase/pg_graphql exposes Relay Global IDs as `nodeId`, but many tables
   * also have a database primary key column called `id` (e.g. UUID).
   *
   * Rewriting `nodeId` -> `id` in the schema creates invalid GraphQL with
   * duplicate field names (e.g. `saved_prompts.id: ID!` + `saved_prompts.id: UUID!`).
   *
   * Instead, keep Supabase's schema intact and configure the Relay compiler
   * to use `nodeId` as the Node interface ID field (see `relay.config.json`).
   */
  const patchedSchema = schemaString;

  // `import.meta.url` is `.../scripts/fetch-schema.js`, so resolve project root first.
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  const schemaPath = path.join(projectRoot, 'src', 'schema.graphql');

  try {
    fs.writeFileSync(schemaPath, patchedSchema);
    console.log('✅ Updated schema.graphql successfully!');
  } catch (err) {
    console.error('Failed to write schema file:', err);
  }
}

updateSchema();
