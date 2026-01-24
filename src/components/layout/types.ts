export type Prompt = {
  id: string;
  title: string;
  instructions: string;
  icon: string;
  winner: 'llama' | 'qwen' | null;
};
