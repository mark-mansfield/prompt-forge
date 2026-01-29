/**
 * @generated SignedSource<<8c05bb7ad5bc21243ffb8d3ce4a82614>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type layoutQuery$variables = Record<PropertyKey, never>;
export type layoutQuery$data = {
  readonly saved_promptsCollection: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly " $fragmentSpreads": FragmentRefs<"sidebar_prompts_fragment">;
      };
    }>;
    readonly pageInfo: {
      readonly hasNextPage: boolean;
    };
  } | null | undefined;
};
export type layoutQuery = {
  response: layoutQuery$data;
  variables: layoutQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasNextPage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "endCursor",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v3 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 50
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "layoutQuery",
    "selections": [
      {
        "alias": "saved_promptsCollection",
        "args": null,
        "concreteType": "saved_promptsConnection",
        "kind": "LinkedField",
        "name": "__Layout__saved_promptsCollection_connection",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "saved_promptsEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "saved_prompts",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "sidebar_prompts_fragment"
                  },
                  (v1/*: any*/)
                ],
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "layoutQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "saved_promptsConnection",
        "kind": "LinkedField",
        "name": "saved_promptsCollection",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "saved_promptsEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "saved_prompts",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
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
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "nodeId",
                    "storageKey": null
                  },
                  (v1/*: any*/)
                ],
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "saved_promptsCollection(first:50)"
      },
      {
        "alias": null,
        "args": (v3/*: any*/),
        "filters": null,
        "handle": "connection",
        "key": "Layout__saved_promptsCollection",
        "kind": "LinkedHandle",
        "name": "saved_promptsCollection"
      }
    ]
  },
  "params": {
    "cacheID": "11fdc5027d195b5ba38d4ade6bb39d68",
    "id": null,
    "metadata": {
      "connection": [
        {
          "count": null,
          "cursor": null,
          "direction": "forward",
          "path": [
            "saved_promptsCollection"
          ]
        }
      ]
    },
    "name": "layoutQuery",
    "operationKind": "query",
    "text": "query layoutQuery {\n  saved_promptsCollection(first: 50) {\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    edges {\n      node {\n        ...sidebar_prompts_fragment\n        nodeId\n        __typename\n      }\n      cursor\n    }\n  }\n}\n\nfragment sidebar_prompts_fragment on saved_prompts {\n  id\n  title\n  icon\n  instructions\n  winner\n}\n"
  }
};
})();

(node as any).hash = "1dfef1f58cb61b3d2cb9e19845f370a8";

export default node;
