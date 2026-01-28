/**
 * @generated SignedSource<<840d218223646057ed0323327057b719>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ActiveTabIdResolverFragment$data = {
  readonly activeTabIdBacking: string | null | undefined;
  readonly " $fragmentType": "ActiveTabIdResolverFragment";
};
export type ActiveTabIdResolverFragment$key = {
  readonly " $data"?: ActiveTabIdResolverFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"ActiveTabIdResolverFragment">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ActiveTabIdResolverFragment",
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
};

(node as any).hash = "15f5cfed2f9f9bab5adc753f2b3c653e";

export default node;
