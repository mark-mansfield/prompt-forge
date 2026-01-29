/**
 * @generated SignedSource<<49acb486b502294e264d6c2461f4c936>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type winner_model = "llama" | "qwen" | "%future added value";
export type saved_promptsInsertInput = {
  created_at?: any | null | undefined;
  icon?: string | null | undefined;
  id?: any | null | undefined;
  instructions?: string | null | undefined;
  model_responses?: any | null | undefined;
  title?: string | null | undefined;
  updated_at?: any | null | undefined;
  winner?: winner_model | null | undefined;
};
export type layoutSavePromptMutation$variables = {
  object: saved_promptsInsertInput;
};
export type layoutSavePromptMutation$data = {
  readonly insertIntosaved_promptsCollection: {
    readonly records: ReadonlyArray<{
      readonly icon: string;
      readonly id: any;
      readonly instructions: string;
      readonly title: string;
      readonly winner: winner_model;
    }>;
  } | null | undefined;
};
export type layoutSavePromptMutation = {
  response: layoutSavePromptMutation$data;
  variables: layoutSavePromptMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "object"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "objects.0",
        "variableName": "object"
      }
    ],
    "kind": "ListValue",
    "name": "objects"
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
    "name": "layoutSavePromptMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "saved_promptsInsertResponse",
        "kind": "LinkedField",
        "name": "insertIntosaved_promptsCollection",
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
    "name": "layoutSavePromptMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "saved_promptsInsertResponse",
        "kind": "LinkedField",
        "name": "insertIntosaved_promptsCollection",
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
    "cacheID": "6dbbdccc42b002cdbdff759fc4179156",
    "id": null,
    "metadata": {},
    "name": "layoutSavePromptMutation",
    "operationKind": "mutation",
    "text": "mutation layoutSavePromptMutation(\n  $object: saved_promptsInsertInput!\n) {\n  insertIntosaved_promptsCollection(objects: [$object]) {\n    records {\n      id\n      title\n      icon\n      instructions\n      winner\n      nodeId\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "794a583730c933716a7ca88e1ff51924";

export default node;
