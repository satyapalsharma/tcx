export const AGENT_RUNTIMES = [
  'Google ADK',
  'CX Agent Studio',
  'Amazon Bedrock',
  'LangGraph',
] as const;

export type AgentRuntime = (typeof AGENT_RUNTIMES)[number];

export function agentFileName(runtime: string): string {
  if (runtime === 'Amazon Bedrock') return 'agent.json';
  if (runtime === 'CX Agent Studio') return 'agent.yaml';
  return 'agent.py';
}
