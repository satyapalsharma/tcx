export type StageType = 'extract_intents' | 'cluster_intents' | 'design_flow' | 'generate_uml' | 'generate_agent' | 'full_pipeline';
export type ArtifactKind = 'insights' | 'clusters' | 'process_map' | 'uml' | 'agent_code';
export type Artifact = {
  id: string; workspaceId: string; kind: ArtifactKind; name: string; status: 'draft' | 'review' | 'approved';
  analytics?: unknown; // Structured transcript/cluster metrics supplied by the analytics service.
  validatedBy?: string; validatedAt?: string; validatedVersion?: number;
  version: number; createdBy: string; updatedAt: string; updatedBy?: string; history?: {version:number;content?:string;analytics?:unknown;notes:string;updatedAt:string;updatedBy:string}[]; sourceId?: string; runId?: string; notes: string; content?: string; sample: boolean;
};
export type PipelineRun = {
  id: string; workspaceId: string; name: string; type: StageType;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'; progress: number;
  steps: { id: string; label: string; status: 'waiting' | 'running' | 'completed' | 'failed' }[];
  createdAt: number; updatedAt: number; sourceArtifactId?: string; sourceVersion?: number; fileName?: string; sourceConnectionId?: string; runtime?: string;
  inputKind?: 'conversations' | 'nuance' | 'ivr'; plannedStages?: Exclude<StageType, 'full_pipeline'>[];
  error?: string; advanced?: Record<string, string | boolean>;
};
export type Connection = { id: string; orgId: string; provider: string; name: string; status: 'connected' | 'attention'; lastSync: string };
export type PipelineEvent = { id: string; orgId: string; workspaceId: string; actor: string; action: string; detail: string; time: number };
export type ClusterNode = { id: string; name: string; level: 'L1' | 'L2' | 'L3'; volume: number; complexity?: number; automationPotential?: number; automationScore?: number; children?: ClusterNode[] };
export const TASK_LABELS: Record<StageType, string> = { extract_intents: 'Conversation analysis', cluster_intents: 'Intent clustering', design_flow: 'Process map', generate_uml: 'UML diagram', generate_agent: 'Agent code', full_pipeline: 'Full pipeline' };
export const ARTIFACT_LABELS: Record<ArtifactKind, string> = { insights: 'Conversation insights', clusters: 'Intent clusters', process_map: 'Process map', uml: 'UML diagram', agent_code: 'Agent code' };
export const STAGE_OUTPUT: Record<Exclude<StageType, 'full_pipeline'>, ArtifactKind> = { extract_intents: 'insights', cluster_intents: 'clusters', design_flow: 'process_map', generate_uml: 'uml', generate_agent: 'agent_code' };
export const STAGE_INPUT: Record<StageType, ArtifactKind[]> = { extract_intents: [], cluster_intents: ['insights'], design_flow: ['clusters'], generate_uml: ['process_map'], generate_agent: ['uml', 'process_map'], full_pipeline: [] };
export const DEMO_INSIGHTS = [
  { id:'in-1', intent:'Dispute an unexpected bill', resolution:'Correct invoice and apply eligible credit', escalation:'Credit exceeds the self-service limit', hold:'Retrieving invoice history', painPoint:'Repeated contacts for the same charge', volume:1842, confidence:0.96, quote:'I cancelled the extra line, but I am still being charged every month.' },
  { id:'in-2', intent:'Check a payment status', resolution:'Confirm receipt and share payment reference', escalation:'Payment missing after settlement', hold:'Checking the payment gateway', painPoint:'No confirmation after payment', volume:1631, confidence:0.94, quote:'The money left my account yesterday. Why does the app still say unpaid?' },
  { id:'in-3', intent:'Report a network outage', resolution:'Confirm area outage and share restoration window', escalation:'No restoration estimate available', hold:'Checking network diagnostics', painPoint:'Unclear outage updates', volume:1530, confidence:0.97, quote:'Everyone on my street has lost internet and nobody knows when it will be back.' },
  { id:'in-4', intent:'Resolve slow internet', resolution:'Run connection diagnostics and reset router', escalation:'Persistent line fault', hold:'Running a line test', painPoint:'Having to repeat troubleshooting', volume:1118, confidence:0.92, quote:'I have restarted the router three times. It still slows down every evening.' },
  { id:'in-5', intent:'Book an installation', resolution:'Verify address and schedule appointment', escalation:'Address not serviceable', hold:'Checking technician availability', painPoint:'Missed installation appointments', volume:1043, confidence:0.95, quote:'I took a day off for the technician and nobody showed up.' },
  { id:'in-6', intent:'Cancel a service', resolution:'Explain closure terms and confirm cancellation', escalation:'Retention or disputed cancellation fee', hold:'Reviewing account terms', painPoint:'Complicated cancellation process', volume:976, confidence:0.93, quote:'I just want to close the account without being transferred again.' },
];
export const DEMO_CLUSTERS: ClusterNode[] = [
  {id:'c-billing',name:'Billing & payments',level:'L1',volume:3473,children:[
    {id:'c-invoice',name:'Invoice disputes',level:'L2',volume:1842,children:[{id:'c-charge',name:'Unexpected charge',level:'L3',volume:1110},{id:'c-credit',name:'Missing credit',level:'L3',volume:732}]},
    {id:'c-payment',name:'Payment status',level:'L2',volume:1631,children:[{id:'c-pending',name:'Payment pending',level:'L3',volume:950},{id:'c-confirm',name:'Confirmation missing',level:'L3',volume:681}]}]},
  {id:'c-network',name:'Network support',level:'L1',volume:2648,children:[
    {id:'c-outage',name:'Connectivity issues',level:'L2',volume:2648,children:[{id:'c-area',name:'Area outage',level:'L3',volume:1530},{id:'c-speed',name:'Slow connection',level:'L3',volume:1118}]}]},
  {id:'c-account',name:'Account services',level:'L1',volume:2019,children:[
    {id:'c-lifecycle',name:'Service lifecycle',level:'L2',volume:2019,children:[{id:'c-install',name:'New installation',level:'L3',volume:1043},{id:'c-cancel',name:'Cancellation',level:'L3',volume:976}]}]},
];
export const DEMO_PROCESS_CONTENT = `flowchart TD
  start[Customer contacts support] --> verify[Verify customer identity]
  verify --> invoice[Retrieve invoice and payment history]
  invoice --> decision{Is the dispute valid?}
  decision --> credit[Apply eligible credit]
  decision --> explain[Explain charges or escalate]
  credit --> confirm[Send confirmation]
  explain --> confirm
  confirm --> end[Resolve and close the case]`;
export const DEMO_UML_CONTENT = `sequenceDiagram
  participant Customer
  participant Orchestrator
  participant Tools
  participant BillingAgent
  Customer->>Orchestrator: Dispute an invoice
  Orchestrator->>Tools: Verify identity and retrieve invoice
  Tools-->>Orchestrator: Account and invoice details
  Orchestrator->>BillingAgent: Evaluate dispute policy
  BillingAgent->>Tools: Apply eligible credit
  Tools-->>BillingAgent: Credit reference
  BillingAgent-->>Orchestrator: Resolution summary
  Orchestrator-->>Customer: Confirm resolution`;
export function agentCode(runtime: string): string {
  if (runtime === 'Amazon Bedrock') return JSON.stringify({agentName:'billing-resolution',instruction:'Verify identity, review the invoice, apply eligible credits and escalate exceptions.',actionGroups:[{actionGroupName:'InvoiceTools',operations:['verify_identity','get_invoice','apply_credit']}],note:'Sample configuration. Supply your execution role, model and tool implementations before deployment.'},null,2);
  if (runtime === 'CX Agent Studio') return JSON.stringify({name:'Billing resolution',start:'verify_customer',steps:[{name:'verify_customer',tool:'verify_identity',next:'review_invoice'},{name:'review_invoice',tool:'get_invoice',next:'resolve_dispute'},{name:'resolve_dispute',tool:'apply_credit',fallback:'human_handoff'}],note:'Sample flow definition. Configure tools and credentials in your runtime.'},null,2);
  if (runtime === 'LangGraph') return `# Sample LangGraph scaffold; implement and bind your tools before running.
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    customer_id: str
    invoice: dict
    resolution: str

def verify_customer(state: State):
    return state  # Bind identity verification here.

def review_invoice(state: State):
    return state  # Bind invoice retrieval here.

def resolve_dispute(state: State):
    return state  # Apply policy and route exceptions to a human.

graph = StateGraph(State)
graph.add_node("verify", verify_customer)
graph.add_node("review", review_invoice)
graph.add_node("resolve", resolve_dispute)
graph.add_edge(START, "verify")
graph.add_edge("verify", "review")
graph.add_edge("review", "resolve")
graph.add_edge("resolve", END)
agent = graph.compile()`;
  return `# Sample Google ADK scaffold; configure a model and real tools before running.
from google.adk.agents import Agent

def get_invoice(customer_id: str) -> dict:
    """Replace this stub with your billing API."""
    return {"status": "tool_not_connected", "customer_id": customer_id}

agent = Agent(
    name="billing_resolution",
    model="YOUR_MODEL_ID",
    instruction="Verify identity before retrieving invoices. Review disputed charges, "
                "apply credits within policy and escalate exceptions to a human.",
    tools=[get_invoice],
)`;
}
export function stageSteps(type: StageType): PipelineRun['steps'] {
  const labels: Record<StageType,string[]> = {
    extract_intents:['Prepare interactions','Extract intents and conversation signals','Assemble insights and evidence'],
    cluster_intents:['Load intent list','Build L1 → L2 → L3 hierarchy','Check coverage and save clusters'],
    design_flow:['Read cluster conversations','Map steps and decision paths','Save process map'],
    generate_uml:['Read process map','Map user, orchestrator, tools and sub-agents','Save UML diagram'],
    generate_agent:['Read design and target runtime','Generate code and tool scaffold','Package agent files'],
    full_pipeline:['Prepare interactions','Analyze conversation signals','Cluster intents','Generate process map','Generate UML diagram','Generate agent code'],
  };
  return labels[type].map((label,index)=>({id:`step-${index}`,label,status:'waiting'}));
}
export const SAMPLE_ARTIFACTS: Artifact[] = [
  {id:'art-insights',runId:'JOB-1042',workspaceId:'ws-cust-ops',kind:'insights',name:'Customer support insights',status:'approved',version:2,createdBy:'Riya Menon',updatedAt:'2026-10-08T08:30:00.000Z',notes:'Six recurring intents with resolutions, escalation and hold reasons, and pain points.',sample:true,content:JSON.stringify(DEMO_INSIGHTS)},
  {id:'art-clusters',runId:'JOB-1043',workspaceId:'ws-cust-ops',kind:'clusters',name:'Support intent taxonomy',status:'review',version:3,createdBy:'Riya Menon',updatedAt:'2026-10-08T09:00:00.000Z',sourceId:'art-insights',notes:'Three levels of taxonomy. Available to the Design team; review is optional.',sample:true,content:JSON.stringify(DEMO_CLUSTERS)},
  {id:'art-map',runId:'JOB-1045',workspaceId:'ws-cust-ops',kind:'process_map',name:'Billing dispute journey',status:'draft',version:1,createdBy:'Devika Sharma',updatedAt:'2026-10-08T09:30:00.000Z',sourceId:'art-clusters',notes:'Captures the recurring billing dispute conversation path.',sample:true,content:DEMO_PROCESS_CONTENT},
  {id:'art-uml',runId:'JOB-1044',workspaceId:'ws-cust-ops',kind:'uml',name:'Billing agent information flow',status:'approved',version:2,createdBy:'Devika Sharma',updatedAt:'2026-10-08T10:00:00.000Z',sourceId:'art-map',notes:'Customer, orchestrator, tools and billing sub-agent exchanges.',sample:true,content:DEMO_UML_CONTENT},
  {id:'art-code',runId:'JOB-1046',workspaceId:'ws-cust-ops',kind:'agent_code',name:'Billing resolution · Google ADK',status:'draft',version:1,createdBy:'Arjun Shah',updatedAt:'2026-10-08T10:30:00.000Z',sourceId:'art-uml',notes:'Google ADK sample scaffold. Tools are not connected.',sample:true,content:agentCode('Google ADK')},
];
