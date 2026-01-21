
import { RelayEnvironmentProvider, useLazyLoadQuery, graphql } from 'react-relay'
import { relayEnvironment } from "./relay/environment";
import './App.css'

const TEST_PROMPT = "test";
const AppPromptTestQuery = graphql`
  query AppPromptTestQuery($prompt: String!, $modelA: String!, $modelB: String!) {
    testPrompt(prompt: $prompt, modelA: $modelA, modelB: $modelB) {
      modelAResponse {
        content
        model
      }
      modelBResponse {
        content
        model
      }
    }
  }
`;

function App() {
  const data = useLazyLoadQuery(
    AppPromptTestQuery,
    { prompt: TEST_PROMPT, modelA: "llama3.1-8b", modelB: "qwen2.5-7b" }
  );

  console.log("prompt", TEST_PROMPT, "response", data);
  return (
    <RelayEnvironmentProvider environment={relayEnvironment}>
      {/* Password gate, PromptEditor, ResponsePanes */}
      <div>
     
      </div>
    </RelayEnvironmentProvider>
  )
}

export default App
