import { afterEach, describe, expect, it, vi } from 'vitest';

import { setActiveTabId } from '../ui-state';
import { commitLocalUpdate } from 'relay-runtime';

vi.mock('relay-runtime', () => ({
  commitLocalUpdate: vi.fn(),
}));

type RootRecord = {
  setValue: (value: unknown, key: string) => void;
};

type StoreProxy = {
  getRoot: () => RootRecord;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('ui-state', () => {
  describe('setActiveTabId', () => {
    it('writes the tab id to the root under activeTabIdBacking', () => {
      const root: RootRecord = { setValue: vi.fn() };
      const store: StoreProxy = { getRoot: vi.fn(() => root) };

      (commitLocalUpdate as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_environment, updater) => {
          updater(store as never);
        }
      );

      const environment = {} as never;
      setActiveTabId(environment, 'tab-123');

      expect(commitLocalUpdate).toHaveBeenCalledTimes(1);
      expect(commitLocalUpdate).toHaveBeenCalledWith(environment, expect.any(Function));
      expect(store.getRoot).toHaveBeenCalledTimes(1);
      expect(root.setValue).toHaveBeenCalledWith('tab-123', 'activeTabIdBacking');
      expect(root.setValue).toHaveBeenCalledTimes(1);
    });
  });
});
