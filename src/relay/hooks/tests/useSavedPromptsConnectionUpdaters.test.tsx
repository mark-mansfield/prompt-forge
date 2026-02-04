/** @vitest-environment jsdom */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ConnectionHandler } from 'relay-runtime';

import { useSavedPromptsConnectionUpdaters } from '../useSavedPromptsConnectionUpdaters';

vi.mock('relay-runtime', () => ({
  ConnectionHandler: {
    getConnection: vi.fn(),
    createEdge: vi.fn(),
    insertEdgeBefore: vi.fn(),
    deleteNode: vi.fn(),
  },
}));

type LinkedRecord = {
  getLinkedRecord?: (name: string) => LinkedRecord | null | undefined;
  getLinkedRecords?: (name: string) => Array<LinkedRecord | null> | null | undefined;
  getValue?: (name: string) => unknown;
  setValue?: (value: unknown, name: string) => void;
};

type StoreProxy = {
  getRoot: () => LinkedRecord;
  getRootField: (name: string) => LinkedRecord | null | undefined;
};

function record(overrides: LinkedRecord = {}): LinkedRecord {
  return {
    getLinkedRecord: vi.fn(() => null),
    getLinkedRecords: vi.fn(() => null),
    getValue: vi.fn(() => undefined),
    setValue: vi.fn(() => undefined),
    ...overrides,
  };
}

function storeProxy(overrides: Partial<StoreProxy> = {}): StoreProxy {
  const root = record();
  return {
    getRoot: vi.fn(() => root),
    getRootField: vi.fn(() => null),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useSavedPromptsConnectionUpdaters', () => {
  describe('updatePromptInSidebarConnection', () => {
    it('updates fields on the matching node (id string comparison)', () => {
      const node0 = record({ getValue: vi.fn(() => 101) });
      const edge0 = record({ getLinkedRecord: vi.fn((name) => (name === 'node' ? node0 : null)) });

      const node1 = record({ getValue: vi.fn(() => 'target-id') });
      const edge1 = record({ getLinkedRecord: vi.fn((name) => (name === 'node' ? node1 : null)) });

      const connection = record({
        getLinkedRecords: vi.fn((name) => (name === 'edges' ? [null, edge0, edge1] : null)),
      });

      const root = record();
      const store = storeProxy({ getRoot: vi.fn(() => root) });

      (ConnectionHandler.getConnection as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        connection as never
      );

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.updatePromptInSidebarConnection(store as never, 'target-id', {
        title: 'T',
        instructions: 'I',
        icon: '⭐',
        winner: 'llama',
      });

      expect(ConnectionHandler.getConnection).toHaveBeenCalledWith(
        root,
        'Layout__saved_promptsCollection'
      );
      expect(node1.setValue).toHaveBeenCalledWith('T', 'title');
      expect(node1.setValue).toHaveBeenCalledWith('I', 'instructions');
      expect(node1.setValue).toHaveBeenCalledWith('⭐', 'icon');
      expect(node1.setValue).toHaveBeenCalledWith('llama', 'winner');
      expect(node1.setValue).toHaveBeenCalledTimes(4);
      expect(node0.setValue).not.toHaveBeenCalled();
    });

    it('no-ops when the saved prompts connection is missing', () => {
      const root = record();
      const store = storeProxy({ getRoot: vi.fn(() => root) });
      (ConnectionHandler.getConnection as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        null as never
      );

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.updatePromptInSidebarConnection(store as never, '1', {
        title: 'T',
        instructions: 'I',
        icon: '⭐',
        winner: 'gemini',
      });

      expect(ConnectionHandler.getConnection).toHaveBeenCalled();
    });

    it('no-ops when edges are missing', () => {
      const connection = record({ getLinkedRecords: vi.fn(() => null) });
      const root = record();
      const store = storeProxy({ getRoot: vi.fn(() => root) });
      (ConnectionHandler.getConnection as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        connection as never
      );

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.updatePromptInSidebarConnection(store as never, '1', {
        title: 'T',
        instructions: 'I',
        icon: '⭐',
        winner: 'gemini',
      });

      expect(connection.getLinkedRecords).toHaveBeenCalledWith('edges');
    });
  });

  describe('addPromptToSidebarConnection', () => {
    it('creates and inserts an edge for the inserted record', () => {
      const inserted = record();
      const payload = record({
        getLinkedRecords: vi.fn((name) => (name === 'records' ? [inserted] : null)),
      });

      const root = record();
      const store = storeProxy({
        getRoot: vi.fn(() => root),
        getRootField: vi.fn((name) =>
          name === 'insertIntosaved_promptsCollection' ? payload : null
        ),
      });

      const connection = record();
      (ConnectionHandler.getConnection as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        connection as never
      );

      const edge = record();
      (ConnectionHandler.createEdge as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        edge as never
      );

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.addPromptToSidebarConnection(store as never);

      expect(store.getRootField).toHaveBeenCalledWith('insertIntosaved_promptsCollection');
      expect(ConnectionHandler.getConnection).toHaveBeenCalledWith(
        root,
        'Layout__saved_promptsCollection'
      );
      expect(ConnectionHandler.createEdge).toHaveBeenCalledWith(
        store,
        connection,
        inserted,
        'saved_promptsEdge'
      );
      expect(ConnectionHandler.insertEdgeBefore).toHaveBeenCalledWith(connection, edge);
    });

    it('no-ops when inserted record is missing', () => {
      const payload = record({
        getLinkedRecords: vi.fn((name) => (name === 'records' ? [] : null)),
      });
      const store = storeProxy({
        getRootField: vi.fn((name) =>
          name === 'insertIntosaved_promptsCollection' ? payload : null
        ),
      });

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.addPromptToSidebarConnection(store as never);

      expect(ConnectionHandler.createEdge).not.toHaveBeenCalled();
      expect(ConnectionHandler.insertEdgeBefore).not.toHaveBeenCalled();
    });
  });

  describe('removePromptFromSidebarConnection', () => {
    it('deletes the node from the connection', () => {
      const root = record();
      const store = storeProxy({ getRoot: vi.fn(() => root) });
      const connection = record();
      (ConnectionHandler.getConnection as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        connection as never
      );

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.removePromptFromSidebarConnection(store as never, 'deadbeef');

      expect(ConnectionHandler.deleteNode).toHaveBeenCalledWith(connection, 'deadbeef');
    });

    it('no-ops when the connection is missing', () => {
      const root = record();
      const store = storeProxy({ getRoot: vi.fn(() => root) });
      (ConnectionHandler.getConnection as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        null as never
      );

      const { result } = renderHook(() => useSavedPromptsConnectionUpdaters());
      result.current.removePromptFromSidebarConnection(store as never, 'deadbeef');

      expect(ConnectionHandler.deleteNode).not.toHaveBeenCalled();
    });
  });
});
