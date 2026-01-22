/**
 * @generated SignedSource<<974e0e58fb572d42d6ca6b053f577aaf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AppPromptTestQuery$variables = {
  modelA: string;
  modelB: string;
  prompt: string;
};
export type AppPromptTestQuery$data = {
  readonly testPrompt: {
    readonly modelAResponse: {
      readonly content: string;
      readonly model: string;
    };
    readonly modelBResponse: {
      readonly content: string;
      readonly model: string;
    };
  };
};
export type AppPromptTestQuery = {
  response: AppPromptTestQuery$data;
  variables: AppPromptTestQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = {
      defaultValue: null,
      kind: 'LocalArgument',
      name: 'modelA',
    },
    v1 = {
      defaultValue: null,
      kind: 'LocalArgument',
      name: 'modelB',
    },
    v2 = {
      defaultValue: null,
      kind: 'LocalArgument',
      name: 'prompt',
    },
    v3 = [
      {
        alias: null,
        args: null,
        kind: 'ScalarField',
        name: 'content',
        storageKey: null,
      },
      {
        alias: null,
        args: null,
        kind: 'ScalarField',
        name: 'model',
        storageKey: null,
      },
    ],
    v4 = [
      {
        alias: null,
        args: [
          {
            kind: 'Variable',
            name: 'modelA',
            variableName: 'modelA',
          },
          {
            kind: 'Variable',
            name: 'modelB',
            variableName: 'modelB',
          },
          {
            kind: 'Variable',
            name: 'prompt',
            variableName: 'prompt',
          },
        ],
        concreteType: 'PromptTestResult',
        kind: 'LinkedField',
        name: 'testPrompt',
        plural: false,
        selections: [
          {
            alias: null,
            args: null,
            concreteType: 'ModelResponse',
            kind: 'LinkedField',
            name: 'modelAResponse',
            plural: false,
            selections: v3 /*: any*/,
            storageKey: null,
          },
          {
            alias: null,
            args: null,
            concreteType: 'ModelResponse',
            kind: 'LinkedField',
            name: 'modelBResponse',
            plural: false,
            selections: v3 /*: any*/,
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ];
  return {
    fragment: {
      argumentDefinitions: [v0 /*: any*/, v1 /*: any*/, v2 /*: any*/],
      kind: 'Fragment',
      metadata: null,
      name: 'AppPromptTestQuery',
      selections: v4 /*: any*/,
      type: 'Query',
      abstractKey: null,
    },
    kind: 'Request',
    operation: {
      argumentDefinitions: [v2 /*: any*/, v0 /*: any*/, v1 /*: any*/],
      kind: 'Operation',
      name: 'AppPromptTestQuery',
      selections: v4 /*: any*/,
    },
    params: {
      cacheID: '49a75137f5f64a4c9f7756937546a1a2',
      id: null,
      metadata: {},
      name: 'AppPromptTestQuery',
      operationKind: 'query',
      text: 'query AppPromptTestQuery(\n  $prompt: String!\n  $modelA: String!\n  $modelB: String!\n) {\n  testPrompt(prompt: $prompt, modelA: $modelA, modelB: $modelB) {\n    modelAResponse {\n      content\n      model\n    }\n    modelBResponse {\n      content\n      model\n    }\n  }\n}\n',
    },
  };
})();

(node as any).hash = '0124e9adda50f3e8c9f85248cc34e167';

export default node;
