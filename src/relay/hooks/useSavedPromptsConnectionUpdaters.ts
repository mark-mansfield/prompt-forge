import { useCallback } from 'react';
import { ConnectionHandler, type RecordSourceSelectorProxy } from 'relay-runtime';

const SAVED_PROMPTS_CONNECTION_KEY = 'Layout__saved_promptsCollection';

type Winner = 'llama' | 'gemini';

type PromptPatch = {
  title: string;
  instructions: string;
  icon: string;
  winner: Winner;
};

export function useSavedPromptsConnectionUpdaters() {
  const updatePromptInSidebarConnection = useCallback(
    (store: RecordSourceSelectorProxy, id: string, patch: PromptPatch) => {
      const root = store.getRoot();
      const connection = ConnectionHandler.getConnection(root, SAVED_PROMPTS_CONNECTION_KEY);
      if (!connection) return;

      const edges = connection.getLinkedRecords('edges');
      if (!edges) return;

      for (const edge of edges) {
        const node = edge?.getLinkedRecord('node');
        if (!node) continue;
        const nodeId = node.getValue('id');
        if (String(nodeId) !== id) continue;

        node.setValue(patch.title, 'title');
        node.setValue(patch.instructions, 'instructions');
        node.setValue(patch.icon, 'icon');
        node.setValue(patch.winner, 'winner');
        return;
      }
    },
    []
  );

  const addPromptToSidebarConnection = useCallback((store: RecordSourceSelectorProxy) => {
    const payload = store.getRootField('insertIntosaved_promptsCollection');
    const inserted = payload?.getLinkedRecords('records')?.[0];
    if (!inserted) return;

    const root = store.getRoot();
    const connection = ConnectionHandler.getConnection(root, SAVED_PROMPTS_CONNECTION_KEY);
    if (!connection) return;

    const edge = ConnectionHandler.createEdge(store, connection, inserted, 'saved_promptsEdge');
    ConnectionHandler.insertEdgeBefore(connection, edge);
  }, []);

  const removePromptFromSidebarConnection = useCallback(
    (store: RecordSourceSelectorProxy, id: string) => {
      const root = store.getRoot();
      const connection = ConnectionHandler.getConnection(root, SAVED_PROMPTS_CONNECTION_KEY);
      if (!connection) return;

      ConnectionHandler.deleteNode(connection, id);
    },
    []
  );

  return {
    addPromptToSidebarConnection,
    updatePromptInSidebarConnection,
    removePromptFromSidebarConnection,
  };
}
