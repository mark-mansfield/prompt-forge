import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import fetch from 'sync-fetch';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';

const SUPABASE_URL = 'https://flkmrgekbfiddnjggyki.supabase.co/graphql/v1';
const SUPABASE_ANON_KEY = 'sb_publishable_V4PkOhKy366ieR9tUdpScQ_nN7UoHZy';

async function updateSchema() {
  console.log('Fetching schema from Supabase...');

  const response = fetch(SUPABASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
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
   * RELAY PATCHING LOGIC
   * * Supabase uses `nodeId` for the Global ID, but Relay requires exactly `id`.
   * We transform the string to map 'nodeId' -> 'id'.
   */
  let patchedSchema = schemaString;

  // 1. Rename 'nodeId' to 'id' in the Node interface definition
  patchedSchema = patchedSchema.replace(
    /interface Node \{[\s\S]*?nodeId: ID!/g,
    'interface Node {\n  id: ID!'
  );

  // Rename 'nodeId' to 'id' in all type definitions
  patchedSchema = patchedSchema.replace(/  nodeId: ID!/g, '  id: ID!');

  // 4. Update the Query.node argument from 'nodeId' to 'id'
  patchedSchema = patchedSchema.replace(
    /node\(\n\s+"""The record's `ID`"""\n\s+nodeId: ID!\n\s+\): Node/g,
    'node(\n    id: ID!\n  ): Node'
  );

  // 5. Update filters (optional but helpful for consistency)
  patchedSchema = patchedSchema.replace(/nodeId: IDFilter/g, 'id: IDFilter');

  const schemaPath = fileURLToPath(new URL('./src/schema.graphql', import.meta.url));

  try {
    fs.writeFileSync(schemaPath, patchedSchema);
    console.log('✅ Updated schema.graphql successfully!');
  } catch (err) {
    console.error('Failed to write schema file:', err);
  }
}

updateSchema();
