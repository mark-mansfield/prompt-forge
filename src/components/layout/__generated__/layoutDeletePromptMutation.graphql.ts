/**
 * @generated SignedSource<<5ad7af249bb371177d087096039fd69b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type FilterIs = "NOT_NULL" | "NULL" | "%future added value";
export type winner_model_enum = "gemini" | "llama" | "%future added value";
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
  winner?: winner_model_enumFilter | null | undefined;
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
export type winner_model_enumFilter = {
  eq?: winner_model_enum | null | undefined;
  in?: ReadonlyArray<winner_model_enum> | null | undefined;
  is?: FilterIs | null | undefined;
  neq?: winner_model_enum | null | undefined;
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
export type layoutDeletePromptMutation$variables = {
  filter: saved_promptsFilter;
};
export type layoutDeletePromptMutation$data = {
  readonly deleteFromsaved_promptsCollection: {
    readonly affectedCount: number;
  };
};
export type layoutDeletePromptMutation = {
  response: layoutDeletePromptMutation$data;
  variables: layoutDeletePromptMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "filter"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "filter",
        "variableName": "filter"
      }
    ],
    "concreteType": "saved_promptsDeleteResponse",
    "kind": "LinkedField",
    "name": "deleteFromsaved_promptsCollection",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "affectedCount",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "layoutDeletePromptMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "layoutDeletePromptMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "137c908d8b096ec4cc61a8f8d8798342",
    "id": null,
    "metadata": {},
    "name": "layoutDeletePromptMutation",
    "operationKind": "mutation",
    "text": "mutation layoutDeletePromptMutation(\n  $filter: saved_promptsFilter!\n) {\n  deleteFromsaved_promptsCollection(filter: $filter) {\n    affectedCount\n  }\n}\n"
  }
};
})();

(node as any).hash = "0863f47fea709296f05eb88547639fbb";

export default node;
