import {
  PIPELINE_STAGES,
  STAGE_INPUT,
  STAGE_OUTPUT,
  TASK_LABELS,
  type ArtifactKind,
  type PipelineStage,
  type StageType,
} from '@/data/pipeline';

export function createPipelinePlan(
  type: StageType,
  endStage?: PipelineStage,
  skipClustering = false,
): PipelineStage[] {
  const first = type === 'full_pipeline' ? 'extract_intents' : type;
  const start = PIPELINE_STAGES.indexOf(first);
  const end = endStage
    ? PIPELINE_STAGES.indexOf(endStage)
    : type === 'full_pipeline'
      ? PIPELINE_STAGES.length - 1
      : start;
  return PIPELINE_STAGES.slice(start, Math.max(start, end) + 1).filter(
    (stage) => !skipClustering || stage !== 'cluster_intents',
  );
}

export function validatePipelinePlan(
  type: StageType,
  stages: readonly PipelineStage[],
  sourceKind?: ArtifactKind,
): string | null {
  if (!stages.length) return 'Choose at least one step.';
  const first = type === 'full_pipeline' ? 'extract_intents' : type;
  if (stages[0] !== first)
    return `Start with ${TASK_LABELS[first].toLowerCase()}.`;
  if (
    stages.some(
      (stage, i) =>
        !PIPELINE_STAGES.includes(stage) ||
        (i > 0 &&
          PIPELINE_STAGES.indexOf(stage) <=
            PIPELINE_STAGES.indexOf(stages[i - 1])),
    )
  )
    return 'Choose each step once, in pipeline order.';
  // Single-stage file uploads already contain the input for that starting tool.
  const available = new Set<ArtifactKind>(
    sourceKind ? [sourceKind] : STAGE_INPUT[first].slice(0, 1),
  );
  for (const stage of stages) {
    const inputs = STAGE_INPUT[stage];
    if (inputs.length && !inputs.some((kind) => available.has(kind))) {
      return stage === 'generate_uml'
        ? 'Generate a process map before a UML diagram.'
        : stage === 'generate_agent'
          ? 'Generate a process map or UML diagram before agent code.'
          : 'Complete intent analysis before clustering or process maps.';
    }
    available.add(STAGE_OUTPUT[stage]);
  }
  return null;
}

export function requiredStagesFor(
  stage: PipelineStage,
  sourceKind?: ArtifactKind,
): PipelineStage[] {
  const available = new Set<ArtifactKind>(sourceKind ? [sourceKind] : []);
  const needed = new Set<PipelineStage>();
  const add = (target: PipelineStage) => {
    const inputs = STAGE_INPUT[target];
    if (inputs.length && !inputs.some((kind) => available.has(kind))) {
      const prerequisite: PipelineStage =
        target === 'cluster_intents' || target === 'design_flow'
          ? 'extract_intents'
          : target === 'generate_uml'
            ? 'design_flow'
            : 'generate_uml';
      add(prerequisite);
    }
    needed.add(target);
    available.add(STAGE_OUTPUT[target]);
  };
  add(stage);
  return PIPELINE_STAGES.filter((item) => needed.has(item));
}
