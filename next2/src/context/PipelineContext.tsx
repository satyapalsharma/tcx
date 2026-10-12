'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useApp } from './AppContext';
import { ARTIFACT_LABELS, SAMPLE_ARTIFACTS, STAGE_INPUT, STAGE_OUTPUT, TASK_LABELS, DEMO_INSIGHTS, DEMO_CLUSTERS, DEMO_PROCESS_CONTENT, DEMO_UML_CONTENT, agentCode, stageSteps, type Artifact, type ArtifactKind, type Connection, type PipelineEvent, type PipelineRun, type StageType } from '@/data/pipeline';

export type StartRunInput = { name?: string; type: StageType; inputKind?: PipelineRun['inputKind']; plannedStages?: PipelineRun['plannedStages']; sourceArtifactId?: string; fileName?: string; sourceConnectionId?: string; runtime?: string; advanced?: Record<string,string|boolean> };
type PipelineState = { artifacts: Artifact[]; runs: PipelineRun[]; connections: Connection[]; events: PipelineEvent[] };
type PipelineContextValue = {
  mode: 'demo'; organizationRuns: PipelineRun[]; organizationArtifacts: Artifact[]; artifacts: Artifact[]; runs: PipelineRun[]; events: PipelineEvent[]; connections: Connection[];
  selectedArtifactId: string | null; selectArtifact: (id: string) => void;
  startRun: (input: StartRunInput) => PipelineRun;
  importArtifact: (input: {name: string; kind: ArtifactKind; fileName: string}) => Artifact;
  updateArtifact: (id: string, patch: Partial<Pick<Artifact,'name'|'status'|'notes'|'content'|'analytics'>>) => void;
  approveArtifact: (id: string) => void;
  handoffArtifact: (id: string, nextType: StageType) => void;
  pauseRun: (id: string) => void; resumeRun: (id: string) => void; cancelRun: (id: string) => void; retryRun: (id: string) => void;
  connectProvider: (provider: string, name: string) => void; disconnectProvider: (id: string) => void;
  recordEvent: (action: string, detail: string) => void;
};
const Context = createContext<PipelineContextValue | null>(null);
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0,8)}`;
const CONTENT: Record<Exclude<ArtifactKind,'agent_code'>,string> = {insights:JSON.stringify(DEMO_INSIGHTS),clusters:JSON.stringify(DEMO_CLUSTERS),process_map:DEMO_PROCESS_CONTENT,uml:DEMO_UML_CONTENT};
const SAMPLE_STATE: PipelineState = {
  artifacts:SAMPLE_ARTIFACTS,
  runs:[
    {id:'JOB-1042',workspaceId:'ws-cust-ops',name:'Customer support analysis',type:'extract_intents',status:'completed',progress:100,steps:stageSteps('extract_intents').map(s=>({...s,status:'completed'})),createdAt:1791446400000,updatedAt:1791448800000,fileName:'support-conversations.csv'},
    {id:'JOB-1043',workspaceId:'ws-cust-ops',name:'Support taxonomy',type:'cluster_intents',status:'completed',progress:100,steps:stageSteps('cluster_intents').map(s=>({...s,status:'completed'})),createdAt:1791448800000,updatedAt:1791450000000,sourceArtifactId:'art-insights'},
    {id:'JOB-1044',workspaceId:'ws-cust-ops',name:'Billing information flow',type:'generate_uml',status:'completed',progress:100,steps:stageSteps('generate_uml').map(s=>({...s,status:'completed'})),createdAt:1791450000000,updatedAt:1791451200000,sourceArtifactId:'art-map'},
    {id:'JOB-1045',workspaceId:'ws-cust-ops',name:'Billing dispute map',type:'design_flow',status:'completed',progress:100,steps:stageSteps('design_flow').map(s=>({...s,status:'completed'})),createdAt:1791449000000,updatedAt:1791450600000,sourceArtifactId:'art-clusters'},
    {id:'JOB-1046',workspaceId:'ws-cust-ops',name:'Billing ADK build',type:'generate_agent',status:'completed',progress:100,steps:stageSteps('generate_agent').map(s=>({...s,status:'completed'})),createdAt:1791451200000,updatedAt:1791452400000,sourceArtifactId:'art-uml',runtime:'Google ADK'},
  ],
  connections:[],
  events:[{id:'evt-sample-1',orgId:'org-skyline',workspaceId:'ws-cust-ops',actor:'Devika Sharma',action:'Design shared with Develop',detail:'Billing agent information flow · v2 · example history',time:1791451200000},{id:'evt-sample-2',orgId:'org-skyline',workspaceId:'ws-cust-ops',actor:'Riya Menon',action:'Taxonomy shared with Design',detail:'Support intent taxonomy · v3 · example history',time:1791450000000}],
};
function outputFor(run: PipelineRun, kind: ArtifactKind, sourceId?: string): Artifact {
  return {id:uid('asset'),workspaceId:run.workspaceId,kind,name:`${ARTIFACT_LABELS[kind]} · ${run.name}`,status:'draft',version:1,createdBy:'Priya Nair',updatedAt:new Date().toISOString(),sourceId,runId:run.id,notes:'Demo output using the billing-support example. Uploaded file contents have not been analyzed.',content:kind==='agent_code'?agentCode(run.runtime??'Google ADK'):CONTENT[kind],sample:true};
}
export function PipelineProvider({children}:{children:ReactNode}) {
  const {currentOrg,currentWorkspace,workspaces,openNewRun} = useApp();
  const [state,setState] = useState<PipelineState>(SAMPLE_STATE);
  const [ready,setReady] = useState(false);
  const [selectedArtifactId,setSelectedArtifactId] = useState<string|null>(null);

  useEffect(()=>{
    try {
      const raw=localStorage.getItem('tx-pipeline-v2');
      if(raw){
        const saved=JSON.parse(raw) as PipelineState;
        if(Array.isArray(saved.artifacts)&&saved.artifacts.every(a=>a&&typeof a.id==='string'&&typeof a.workspaceId==='string'&&typeof a.kind==='string')&&Array.isArray(saved.runs)&&saved.runs.every(r=>r&&typeof r.id==='string'&&Array.isArray(r.steps))&&Array.isArray(saved.connections)&&Array.isArray(saved.events)){
          // External local-storage hydration happens after the server-rendered shell.
          const sampleRunIds: Record<string,string> = {'art-insights':'JOB-1042','art-clusters':'JOB-1043','art-uml':'JOB-1044','art-map':'JOB-1045','art-code':'JOB-1046'};
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState({...saved, runs:[...saved.runs,...SAMPLE_STATE.runs.filter(run=>!saved.runs.some(existing=>existing.id===run.id)&&saved.artifacts.some(a=>a.id==='art-map'||a.id==='art-code'))], artifacts:saved.artifacts.map(a => sampleRunIds[a.id] && !a.runId ? {...a,runId:sampleRunIds[a.id]} : a)});
        }
      }
    }catch{/* Unavailable storage leaves the isolated demo usable. */}
    setReady(true);
  },[]);
  useEffect(()=>{if(ready){try{localStorage.setItem('tx-pipeline-v2',JSON.stringify(state));}catch{/* Browser storage is optional. */}}},[state,ready]);

  // Demo-only job worker. A real backend adapter must replace this timer, never run alongside it.
  useEffect(()=>{
    if(!ready)return;
    const timer=window.setInterval(()=>setState(previous=>{
      if(!previous.runs.some(r=>r.status==='queued'||r.status==='running'))return previous;
      let artifacts=[...previous.artifacts];
      const events=[...previous.events];
      const activeWorkspaces=new Set(previous.runs.filter(r=>r.status==='running').map(r=>r.workspaceId));
      const claimed=new Set<string>();
      const runs=previous.runs.map(run=>{
        if(run.status==='queued'){
          if(activeWorkspaces.has(run.workspaceId)||claimed.has(run.workspaceId))return run;
          claimed.add(run.workspaceId);
          return {...run,status:'running' as const,updatedAt:Date.now(),steps:run.steps.map((s,i)=>({...s,status:run.progress>=(i+1)*100/run.steps.length?'completed' as const:run.progress>=i*100/run.steps.length?'running' as const:'waiting' as const}))};
        }
        if(run.status!=='running')return run;
        const progress=Math.min(100,run.progress+4);
        const steps=run.steps.map((step,index)=>({...step,status:progress>=(index+1)*100/run.steps.length?'completed' as const:progress>=index*100/run.steps.length?'running' as const:'waiting' as const}));
        if(run.type==='full_pipeline'||(run.plannedStages?.length??0)>1){
          const kinds: ArtifactKind[] = run.plannedStages?.map(stage=>STAGE_OUTPUT[stage]) ?? ['insights','clusters','process_map','uml','agent_code'];
          kinds.forEach((kind,index)=>{
            if(steps[index+1]?.status==='completed'&&!artifacts.some(a=>a.runId===run.id&&a.kind===kind)){
              const prior=artifacts.filter(a=>a.runId===run.id).at(-1);
              artifacts.push(outputFor(run,kind,prior?.id??run.sourceArtifactId));
            }
          });
        }else if(progress===100&&!artifacts.some(a=>a.runId===run.id)){
          artifacts.push(outputFor(run,STAGE_OUTPUT[run.type as Exclude<StageType,'full_pipeline'>],run.sourceArtifactId));
        }
        if(progress===100){
          const orgId=workspaces.find(w=>w.id===run.workspaceId)?.orgId??currentOrg.id;
          events.unshift({id:uid('event'),orgId,workspaceId:run.workspaceId,actor:'Demo worker',action:'Job completed',detail:`${run.name} · ${TASK_LABELS[run.type]}`,time:Date.now()});
        }
        return {...run,progress,steps,status:progress===100?'completed' as const:'running' as const,updatedAt:Date.now()};
      });
      artifacts=artifacts.filter(a=>workspaces.some(w=>w.id===a.workspaceId));
      return {...previous,runs,artifacts,events:events.slice(0,250)};
    }),1800);
    return ()=>window.clearInterval(timer);
  },[ready,currentOrg.id,workspaces]);

  const organizationProjectIds=new Set(workspaces.filter(project=>project.orgId===currentOrg.id).map(project=>project.id));
  const organizationRuns=state.runs.filter(run=>organizationProjectIds.has(run.workspaceId));
  const organizationArtifacts=state.artifacts.filter(artifact=>organizationProjectIds.has(artifact.workspaceId));
  const artifacts=state.artifacts.filter(a=>a.workspaceId===currentWorkspace.id);
  const runs=state.runs.filter(r=>r.workspaceId===currentWorkspace.id);
  const connections=state.connections.filter(c=>c.orgId===currentOrg.id);
  const events=state.events.filter(e=>e.orgId===currentOrg.id);
  const event=(action:string,detail:string):PipelineEvent=>({id:uid('event'),orgId:currentOrg.id,workspaceId:currentWorkspace.id,actor:'Priya Nair',action,detail,time:Date.now()});
  const recordEvent=(action:string,detail:string)=>setState(previous=>({...previous,events:[event(action,detail),...previous.events].slice(0,250)}));
  const startRun=(input:StartRunInput):PipelineRun=>{
    if(input.sourceArtifactId){
      const source=artifacts.find(a=>a.id===input.sourceArtifactId);
      if(!source||!STAGE_INPUT[input.type].includes(source.kind))throw new Error('Choose a compatible input from this project.');
    }else if(!input.fileName&&!input.sourceConnectionId){throw new Error('Choose a file, connected source, or workspace output.');}
    if(input.sourceConnectionId&&!connections.some(c=>c.id===input.sourceConnectionId&&c.status==='connected'))throw new Error('Choose a connected source in this organization.');
    if(input.plannedStages){
      const order: Exclude<StageType,'full_pipeline'>[]=['extract_intents','cluster_intents','design_flow','generate_uml','generate_agent'];
      const first=order.indexOf(input.type==='full_pipeline'?'extract_intents':input.type);
      if(!input.plannedStages.length||input.plannedStages.some((stage,index)=>stage!==order[first+index]))throw new Error('Choose consecutive upcoming pipeline steps.');
    }
    const name=input.name?.trim()||`${TASK_LABELS[input.type]} · ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`;
    const plannedStages=input.plannedStages;
    const steps=plannedStages&&(plannedStages.length>1||input.type==='full_pipeline')?[{id:'prepare',label:'Prepare input',status:'waiting' as const},...plannedStages.map(stage=>({id:stage,label:TASK_LABELS[stage],status:'waiting' as const}))]:stageSteps(input.type);
    const run:PipelineRun={id:uid('JOB').toUpperCase(),workspaceId:currentWorkspace.id,name,type:input.type,status:'queued',progress:0,steps,inputKind:input.inputKind,plannedStages,createdAt:Date.now(),updatedAt:Date.now(),sourceArtifactId:input.sourceArtifactId,sourceVersion:artifacts.find(a=>a.id===input.sourceArtifactId)?.version,fileName:input.fileName,sourceConnectionId:input.sourceConnectionId,runtime:input.runtime,advanced:input.advanced};
    setState(previous=>({...previous,runs:[run,...previous.runs],events:[event('Job queued',`${name} · ${TASK_LABELS[input.type]}`),...previous.events]}));
    return run;
  };
  const importArtifact=({name,kind,fileName}:{name:string;kind:ArtifactKind;fileName:string}):Artifact=>{
    const asset:Artifact={id:uid('import'),workspaceId:currentWorkspace.id,kind,name,status:'draft',version:1,createdBy:'Priya Nair',updatedAt:new Date().toISOString(),notes:`Imported file: ${fileName}. Demo preview uses the billing-support fixture; file contents are not parsed.`,content:kind==='agent_code'?agentCode('Google ADK'):CONTENT[kind],sample:true};
    setState(previous=>({...previous,artifacts:[asset,...previous.artifacts],events:[event('Input imported',`${name} · ${fileName} · demo preview`),...previous.events]}));
    setSelectedArtifactId(asset.id);
    return asset;
  };
  const updateArtifact=(id:string,patch:Partial<Pick<Artifact,'name'|'status'|'notes'|'content'|'analytics'>>)=>{
    const target=artifacts.find(a=>a.id===id);if(!target)return;
    const contentChanged=patch.content!==undefined&&patch.content!==target.content;
    const revised=contentChanged||(patch.analytics!==undefined&&JSON.stringify(patch.analytics)!==JSON.stringify(target.analytics))||(patch.name!==undefined&&patch.name!==target.name)||(patch.notes!==undefined&&patch.notes!==target.notes);
    setState(previous=>({...previous,artifacts:previous.artifacts.map(a=>a.id===id?{...a,...patch,status:revised?'draft':patch.status??a.status,validatedBy:revised?undefined:patch.status==='approved'?'Priya Nair':a.validatedBy,validatedAt:revised?undefined:patch.status==='approved'?new Date().toISOString():a.validatedAt,validatedVersion:revised?undefined:patch.status==='approved'?a.version:a.validatedVersion,version:revised?a.version+1:a.version,updatedBy:'Priya Nair',history:revised?[...(a.history??[]),{version:a.version,content:a.content,analytics:a.analytics,notes:a.notes,updatedAt:a.updatedAt,updatedBy:a.updatedBy??a.createdBy}].slice(-20):a.history,updatedAt:new Date().toISOString()}:a),events:[event(revised?'New output revision':patch.status==='approved'?'SME validation recorded':'Output updated',`${target.name} · v${revised?target.version+1:target.version}`),...previous.events]}));
  };
  const approveArtifact=(id:string)=>updateArtifact(id,{status:'approved'});
  const handoffArtifact=(id:string,nextType:StageType)=>{
    const target=artifacts.find(a=>a.id===id);
    if(!target||!STAGE_INPUT[nextType].includes(target.kind))return;
    setSelectedArtifactId(id);openNewRun(nextType);
  };
  const controlRun=(id:string,action:'pause'|'resume'|'cancel'|'retry')=>{
    const target=runs.find(r=>r.id===id);if(!target)return;
    if(action==='pause'&&!['queued','running'].includes(target.status))return;
    if(action==='resume'&&target.status!=='paused')return;
    if(action==='cancel'&&!['queued','running','paused'].includes(target.status))return;
    if(action==='retry'&&!['failed','cancelled'].includes(target.status))return;
    setState(previous=>({...previous,runs:previous.runs.map(r=>r.id===id?{...r,status:action==='pause'?'paused':action==='cancel'?'cancelled':'queued',progress:action==='retry'?0:r.progress,steps:action==='retry'?r.steps.map(step=>({...step,status:'waiting' as const})):r.steps,error:undefined,updatedAt:Date.now()}:r),events:[event(`Job ${action==='retry'?'retried':action==='pause'?'paused':action==='resume'?'resumed':'cancelled'}`,target.name),...previous.events]}));
  };
  const connectProvider=(provider:string,name:string)=>{
    const connection:Connection={id:uid('connection'),orgId:currentOrg.id,provider,name:name.trim()||provider,status:'connected',lastSync:'Demo · no external sync'};
    setState(previous=>({...previous,connections:[connection,...previous.connections],events:[event('Demo connection added',connection.name),...previous.events]}));
  };
  const disconnectProvider=(id:string)=>{
    const target=connections.find(c=>c.id===id);if(!target)return;
    setState(previous=>({...previous,connections:previous.connections.filter(c=>c.id!==id),events:[event('Demo connection removed',target.name),...previous.events]}));
  };
  if(!ready)return <div className="min-h-screen grid place-items-center text-muted text-sm" role="status">Opening project…</div>;
  return <Context.Provider value={{mode:'demo',organizationRuns,organizationArtifacts,artifacts,runs,connections,events,selectedArtifactId,selectArtifact:setSelectedArtifactId,startRun,importArtifact,updateArtifact,approveArtifact,handoffArtifact,pauseRun:id=>controlRun(id,'pause'),resumeRun:id=>controlRun(id,'resume'),cancelRun:id=>controlRun(id,'cancel'),retryRun:id=>controlRun(id,'retry'),connectProvider,disconnectProvider,recordEvent}}>{children}</Context.Provider>;
}
export function usePipeline(){const value=useContext(Context);if(!value)throw new Error('PipelineProvider is required');return value;}
