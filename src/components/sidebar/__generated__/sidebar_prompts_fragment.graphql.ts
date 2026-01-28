/**
 * @generated SignedSource<<80b721ffb2a585cc6fd8a096f3ca5029>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type winner_model = "llama" | "qwen" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type sidebar_prompts_fragment$data = ReadonlyArray<{
  readonly icon: string;
  readonly id: any;
  readonly instructions: string;
  readonly title: string;
  readonly winner: winner_model;
  readonly " $fragmentType": "sidebar_prompts_fragment";
}>;
export type sidebar_prompts_fragment$key = ReadonlyArray<{
  readonly " $data"?: sidebar_prompts_fragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"sidebar_prompts_fragment">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "sidebar_prompts_fragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "icon",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "instructions",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "winner",
      "storageKey": null
    }
  ],
  "type": "saved_prompts",
  "abstractKey": null
};

(node as any).hash = "8f024e8a9afa97f45033658b5ef25323";

export default node;
