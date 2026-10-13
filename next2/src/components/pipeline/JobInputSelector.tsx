'use client';

import {
  ARTIFACT_LABELS,
  STAGE_INPUT,
  type Artifact,
  type StageType,
} from '@/data/pipeline';
import type { Connection } from '@/data/pipeline';
import { Badge } from '@/components/ui/badge';
import { FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SelectField } from '@/components/common';

export type JobSourceMode = 'artifact' | 'file' | 'connection';
export type JobInputKind = 'conversations' | 'nuance' | 'ivr';

const ACCEPT: Record<StageType, string> = {
  extract_intents: '.xlsx,.xls,.csv,.json,.txt,.eml,.mp3,.wav,.m4a,.mp4',
  cluster_intents: '.csv,.json',
  design_flow: '.json,.csv',
  generate_uml: '.json,.puml,.mmd,.txt',
  generate_agent: '.json,.mmd,.puml,.txt,.yaml,.yml,.py,.ts',
  full_pipeline: '.xlsx,.xls,.csv,.json,.txt,.eml,.mp3,.wav,.m4a,.mp4',
};
const FORMAT_HELP: Record<StageType, string> = {
  extract_intents: 'Conversation data: Excel, CSV, JSON, TXT, EML, or audio.',
  cluster_intents: 'Intent lists: CSV or JSON.',
  design_flow: 'Conversation insights or intent clusters: JSON or CSV.',
  generate_uml:
    'Process maps or diagram definitions: JSON, PlantUML, Mermaid, or text.',
  generate_agent:
    'Process maps or UML definitions: JSON, Mermaid, PlantUML, or text.',
  full_pipeline: 'Conversation data: Excel, CSV, JSON, TXT, EML, or audio.',
};

type Props = {
  taskType: StageType;
  sourceMode: JobSourceMode;
  onSourceModeChange: (mode: JobSourceMode) => void;
  artifacts: Artifact[];
  chosenArtifact?: Artifact;
  artifactId: string;
  onArtifactChange: (id: string) => void;
  connections: Connection[];
  connectionId: string;
  onConnectionChange: (id: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  inputKind: JobInputKind;
  onInputKindChange: (kind: JobInputKind) => void;
  disabled?: boolean;
};

export function JobInputSelector({
  taskType,
  sourceMode,
  onSourceModeChange,
  artifacts,
  chosenArtifact,
  artifactId,
  onArtifactChange,
  connections,
  connectionId,
  onConnectionChange,
  file,
  onFileChange,
  inputKind,
  onInputKindChange,
  disabled = false,
}: Props) {
  const hasConnections =
    taskType === 'extract_intents' || taskType === 'full_pipeline';
  const connectedSources = connections.filter(
    (connection) => connection.status === 'connected',
  );
  const sourceModes: JobSourceMode[] = [
    ...(STAGE_INPUT[taskType].length ? ['artifact' as const] : []),
    'file',
    ...(hasConnections ? ['connection' as const] : []),
  ];
  const acceptedFiles =
    hasConnections && inputKind === 'nuance'
      ? '.doc,.docx,.pdf,.txt,.xml'
      : hasConnections && inputKind === 'ivr'
        ? '.xlsx,.xls,.csv,.json,.xml,.txt'
        : ACCEPT[taskType];
  const formatHelp =
    hasConnections && inputKind === 'nuance'
      ? 'Nuance documents: DOC, DOCX, PDF, TXT or XML.'
      : hasConnections && inputKind === 'ivr'
        ? 'IVR flows and interaction logs: Excel, CSV, JSON, XML or TXT.'
        : FORMAT_HELP[taskType];

  return (
    <FieldSet disabled={disabled} className="gap-3">
      <FieldLegend className="text-sm font-medium">Your input</FieldLegend>
      {sourceModes.length > 1 && (
        <ToggleGroup
          type="single"
          value={sourceMode}
          disabled={disabled}
          onValueChange={(value) => {
            if (sourceModes.includes(value as JobSourceMode))
              onSourceModeChange(value as JobSourceMode);
          }}
          variant="outline"
          size="sm"
          spacing={2}
          className="flex flex-wrap"
          aria-label="Input source"
        >
          {sourceModes.map((mode) => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              className="data-[state=on]:border-accent-strong/40 data-[state=on]:bg-accent-soft data-[state=on]:text-accent-strong"
            >
              {mode === 'artifact'
                ? 'Project output'
                : mode === 'file'
                  ? 'Upload a file'
                  : 'Connected source'}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {sourceMode === 'artifact' && (
        <div className="space-y-2">
          {artifacts.length ? (
            <>
              <SelectField
                id="job-artifact"
                aria-label="Choose a compatible project output"
                value={artifactId || chosenArtifact?.id || ''}
                onValueChange={onArtifactChange}
                disabled={disabled}
                options={artifacts.map((artifact) => ({
                  value: artifact.id,
                  label: `${artifact.id === chosenArtifact?.id ? chosenArtifact.name : artifact.name} · v${artifact.id === chosenArtifact?.id ? chosenArtifact.version : artifact.version}`,
                }))}
                className="h-10 w-full"
              />
              <div className="flex flex-wrap gap-2">
                {chosenArtifact && (
                  <Badge variant="outline">
                    {chosenArtifact.status === 'approved'
                      ? 'Validated'
                      : 'Not validated'}{' '}
                    · {chosenArtifact.createdBy} · v{chosenArtifact.version}
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted">
              No{' '}
              {STAGE_INPUT[taskType]
                .map((kind) => ARTIFACT_LABELS[kind])
                .join(' or ')}{' '}
              in this project yet. Upload your own input file or continue in
              another stage.
            </p>
          )}
        </div>
      )}
      {sourceMode === 'file' && (
        <div className="space-y-2">
          {hasConnections && (
            <FieldSet>
              <FieldLegend className="mb-2 text-xs font-medium">
                Data type
              </FieldLegend>
              <ToggleGroup
                type="single"
                value={inputKind}
                disabled={disabled}
                onValueChange={(value) => {
                  if (
                    value === 'conversations' ||
                    value === 'nuance' ||
                    value === 'ivr'
                  )
                    onInputKindChange(value);
                }}
                variant="outline"
                size="sm"
                spacing={2}
                className="flex flex-wrap"
                aria-label="Data type"
              >
                {(['conversations', 'nuance', 'ivr'] as const).map((kind) => (
                  <ToggleGroupItem
                    key={kind}
                    value={kind}
                    className="data-[state=on]:border-accent-strong/40 data-[state=on]:bg-accent-soft data-[state=on]:text-accent-strong"
                  >
                    {kind === 'conversations'
                      ? 'Excel / conversations'
                      : kind === 'nuance'
                        ? 'Nuance document'
                        : 'IVR data'}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
          )}
          <Input
            key={`${taskType}-${inputKind}`}
            aria-label="Choose an input file"
            type="file"
            disabled={disabled}
            accept={acceptedFiles}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="h-auto min-h-10 cursor-pointer py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-surface-inset file:px-2 file:py-1 file:text-xs file:font-medium"
          />
          <p className="text-xs text-muted">
            {formatHelp}{' '}
            {file && (
              <span className="font-medium text-foreground">
                Selected: {file.name} (
                {Math.max(1, Math.round(file.size / 1024))} KB)
              </span>
            )}
          </p>
        </div>
      )}
      {sourceMode === 'connection' && (
        <div className="space-y-2">
          {connectedSources.length ? (
            <>
              <SelectField
                id="job-connection"
                aria-label="Choose a connected source"
                value={connectionId}
                onValueChange={onConnectionChange}
                options={connectedSources.map((connection) => ({
                  value: connection.id,
                  label: `${connection.name} · ${connection.provider}`,
                }))}
                placeholder="Choose connected source"
                className="h-10 w-full"
                disabled={disabled}
              />
              <p className="text-xs text-muted">
                Uses an existing organization connection. This demo does not
                sync external data.
              </p>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted">
              No connected sources are set up for this organization. Add one in
              Connections, or upload a file.
            </p>
          )}
        </div>
      )}
      {sourceMode === 'artifact' && chosenArtifact && (
        <p className="text-[11px] leading-4 text-muted">
          Shared drafts can be used directly. Reviews are optional.
        </p>
      )}
    </FieldSet>
  );
}
