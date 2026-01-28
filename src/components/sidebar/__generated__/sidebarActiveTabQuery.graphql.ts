/**
 * @generated SignedSource<<49bf322e5d1e8362f10bd826eb033e89>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
import queryActiveTabIdResolverType from "../../../relay/resolvers/ActiveTabIdResolver";
// Type assertion validating that `queryActiveTabIdResolverType` resolver is correctly implemented.
// A type error here indicates that the type signature of the resolver module is incorrect.
(queryActiveTabIdResolverType satisfies (
  rootKey: ActiveTabIdResolverFragment$key,
) => unknown);
export type sidebarActiveTabQuery$variables = Record<PropertyKey, never>;
export type sidebarActiveTabQuery$data = {
  readonly activeTabId: NonNullable<ReturnType<typeof queryActiveTabIdResolverType>>;
};
export type sidebarActiveTabQuery = {
  response: sidebarActiveTabQuery$data;
  variables: sidebarActiveTabQuery$variables;
};

import queryActiveTabIdResolver from '../../../relay/resolvers/ActiveTabIdResolver';

const node: ConcreteRequest = {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "sidebarActiveTabQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "fragment": {
          "args": null,
          "kind": "FragmentSpread",
          "name": "ActiveTabIdResolverFragment"
        },
        "kind": "RelayResolver",
        "name": "activeTabId",
        "resolverModule": queryActiveTabIdResolver,
        "path": "activeTabId"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "sidebarActiveTabQuery",
    "selections": [
      {
        "name": "activeTabId",
        "args": null,
        "fragment": {
          "kind": "InlineFragment",
          "selections": [
            {
              "kind": "ClientExtension",
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "activeTabIdBacking",
                  "storageKey": null
                }
              ]
            }
          ],
          "type": "Query",
          "abstractKey": null
        },
        "kind": "RelayResolver",
        "storageKey": null,
        "isOutputType": false
      }
    ]
  },
  "params": {
    "cacheID": "c98b434d354dc494082f0cff428b3a1f",
    "id": null,
    "metadata": {},
    "name": "sidebarActiveTabQuery",
    "operationKind": "query",
    "text": null
  }
};

(node as any).hash = "31cb40d0f8cf4152aafc3dee79315e59";

export default node;
