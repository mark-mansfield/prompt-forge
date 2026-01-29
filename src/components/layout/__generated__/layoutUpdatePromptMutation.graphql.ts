/**
 * @generated SignedSource<<26a63ad907dd6e426ba49ea2f96f75aa>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type FilterIs = "NOT_NULL" | "NULL" | "%future added value";
export type winner_model = "llama" | "qwen" | "%future added value";
export type saved_promptsFilter = {
  and?: ReadonlyArray<saved_promptsFilter> | null | undefined;
  created_at?: DatetimeFilter | null | undefined;
  icon?: StringFilter | null | undefined;
  id?: UUIDFilter | null | undefined;
  instructions?: StringFilter | null | undefined;
  nodeId?: IDFilter | null | undefined;
  not?: saved_promptsFilter | null | undefined;
  or?: ReadonlyArray<saved_promptsFilter> | null | undefined;
  title?: StringFilter | null | undefined;
  updated_at?: DatetimeFilter | null | undefined;
  winner?: winner_modelFilter | null | undefined;
};
export type UUIDFilter = {
  eq?: any | null | undefined;
  in?: ReadonlyArray<any> | null | undefined;
  is?: FilterIs | null | undefined;
  neq?: any | null | undefined;
};
export type StringFilter = {
  eq?: string | null | undefined;
  gt?: string | null | undefined;
  gte?: string | null | undefined;
  ilike?: string | null | undefined;
  in?: ReadonlyArray<string> | null | undefined;
  iregex?: string | null | undefined;
  is?: FilterIs | null | undefined;
  like?: string | null | undefined;
  lt?: string | null | undefined;
  lte?: string | null | undefined;
  neq?: string | null | undefined;
  regex?: string | null | undefined;
  startsWith?: string | null | undefined;
};
export type winner_modelFilter = {
  eq?: winner_model | null | undefined;
  in?: ReadonlyArray<winner_model> | null | undefined;
  is?: FilterIs | null | undefined;
  neq?: winner_model | null | undefined;
};
export type DatetimeFilter = {
  eq?: any | null | undefined;
  gt?: any | null | undefined;
  gte?: any | null | undefined;
  in?: ReadonlyArray<any> | null | undefined;
  is?: FilterIs | null | undefined;
  lt?: any | null | undefined;
  lte?: any | null | undefined;
  neq?: any | null | undefined;
};
export type IDFilter = {
  eq?: string | null | undefined;
};
export type saved_promptsUpdateInput = {
  created_at?: any | null | undefined;
  icon?: string | null | undefined;
  id?: any | null | undefined;
  instructions?: string | null | undefined;
  title?: string | null | undefined;
  updated_at?: any | null | undefined;
  winner?: winner_model | null | undefined;
};
export type layoutUpdatePromptMutation$variables = {
  filter: saved_promptsFilter;
  set: saved_promptsUpdateInput;
};
export type layoutUpdatePromptMutation$data = {
  readonly updatesaved_promptsCollection: {
    readonly records: ReadonlyArray<{
      readonly icon: string;
      readonly id: any;
      readonly instructions: string;
      readonly title: string;
      readonly winner: winner_model;
    }>;
  };
};
export type layoutUpdatePromptMutation = {
  response: layoutUpdatePromptMutation$data;
  variables: layoutUpdatePromptMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "filter"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "set"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "filter",
    "variableName": "filter"
  },
  {
    "kind": "Variable",
    "name": "set",
    "variableName": "set"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "icon",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "instructions",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "winner",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "layoutUpdatePromptMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "saved_promptsUpdateResponse",
        "kind": "LinkedField",
        "name": "updatesaved_promptsCollection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "saved_prompts",
            "kind": "LinkedField",
            "name": "records",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "layoutUpdatePromptMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "saved_promptsUpdateResponse",
        "kind": "LinkedField",
        "name": "updatesaved_promptsCollection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "saved_prompts",
            "kind": "LinkedField",
            "name": "records",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "nodeId",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "cb1f93eb35d8a1c7c0fceab124146ed7",
    "id": null,
    "metadata": {},
    "name": "layoutUpdatePromptMutation",
    "operationKind": "mutation",
    "text": "mutation layoutUpdatePromptMutation(\n  $filter: saved_promptsFilter!\n  $set: saved_promptsUpdateInput!\n) {\n  updatesaved_promptsCollection(filter: $filter, set: $set) {\n    records {\n      id\n      title\n      icon\n      instructions\n      winner\n      nodeId\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "404a9d026e19ea5aa1f2ad610b467bde";

export default node;
