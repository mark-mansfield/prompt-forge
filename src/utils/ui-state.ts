import { commitLocalUpdate } from 'relay-runtime';
import type { Environment } from 'relay-runtime';

export function setActiveTabId(environment: Environment, tabId: string) {
  commitLocalUpdate(environment, (store) => {
    store.getRoot().setValue(tabId, 'activeTabIdBacking');
  });
}
