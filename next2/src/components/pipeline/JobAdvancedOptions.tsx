'use client';

import { SelectField } from '@/components/common';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { StageType } from '@/data/pipeline';

import type { ClusterOption } from '@/lib/cluster-options';

type Props = {
  taskType: StageType;
  advanced: Record<string, string | boolean>;
  onChange: (next: Record<string, string | boolean>) => void;
  clusterOptions?: readonly ClusterOption[];
  canSkipClustering?: boolean;
  canUseExpressMode?: boolean;
  executionMode?: 'guided' | 'express';
  onExecutionModeChange?: (mode: 'guided' | 'express') => void;
};

export function JobAdvancedOptions({
  taskType,
  advanced,
  onChange,
  clusterOptions = [],
  canSkipClustering = false,
  canUseExpressMode = false,
  executionMode = 'guided',
  onExecutionModeChange,
}: Props) {
  const clusterTarget = clusterOptions.some(
    (option) => option.value === advanced.clusterTarget,
  )
    ? String(advanced.clusterTarget)
    : 'all';

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-xl border border-border px-3"
    >
      <AccordionItem value="advanced-options" className="border-0">
        <AccordionTrigger className="py-3 text-muted hover:no-underline">
          Advanced options{' '}
          <span className="ml-2 text-xs font-normal">
            Defaults are suitable for most jobs
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-3 border-t border-border py-3 sm:grid-cols-2">
            {canUseExpressMode && onExecutionModeChange && (
              <div className="flex items-start gap-2.5 sm:col-span-2">
                <Checkbox
                  id="job-express-mode"
                  checked={executionMode === 'express'}
                  onCheckedChange={(checked) =>
                    onExecutionModeChange(
                      checked === true ? 'express' : 'guided',
                    )
                  }
                />
                <div className="space-y-0.5">
                  <Label htmlFor="job-express-mode">Express mode</Label>
                  <p className="text-xs leading-5 text-muted">
                    Run the selected stages continuously without review pauses.
                    Guided mode pauses for handoff between stages.
                  </p>
                </div>
              </div>
            )}
            {(taskType === 'extract_intents' ||
              taskType === 'full_pipeline') && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="job-language">Conversation language</Label>
                  <SelectField
                    id="job-language"
                    value={String(advanced.language)}
                    onValueChange={(value) =>
                      onChange({ ...advanced, language: value })
                    }
                    options={['Auto-detect', 'English', 'Hindi', 'Spanish']}
                    className="h-9 w-full"
                  />
                </div>
                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox
                    id="job-mask-sensitive-data"
                    checked={advanced.maskSensitiveData !== false}
                    onCheckedChange={(checked) =>
                      onChange({
                        ...advanced,
                        maskSensitiveData: checked === true,
                        // Preserve the earlier display setting for saved jobs
                        // that still read the legacy redaction field.
                        redaction:
                          checked === true ? 'Standard masking' : 'Off',
                      })
                    }
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="job-mask-sensitive-data">
                      Mask sensitive data
                    </Label>
                    <p className="text-xs leading-5 text-muted">
                      Recommended. Hide personal and payment details in
                      generated outputs.
                    </p>
                  </div>
                </div>
              </>
            )}
            {canSkipClustering && (
              <div className="flex items-start gap-2.5 pt-1 sm:col-span-2">
                <Checkbox
                  id="job-skip-clustering"
                  checked={advanced.skipClustering === true}
                  onCheckedChange={(checked) =>
                    onChange({ ...advanced, skipClustering: checked === true })
                  }
                />
                <div className="space-y-0.5">
                  <Label htmlFor="job-skip-clustering">
                    Skip intent clustering
                  </Label>
                  <p className="text-xs leading-5 text-muted">
                    Build the process map directly from conversation insights.
                  </p>
                </div>
              </div>
            )}
            {taskType === 'cluster_intents' && (
              <div className="space-y-1.5">
                <Label htmlFor="job-depth">Taxonomy depth</Label>
                <SelectField
                  id="job-depth"
                  value={String(advanced.groupDepth)}
                  onValueChange={(value) =>
                    onChange({ ...advanced, groupDepth: value })
                  }
                  options={[
                    'L1 only',
                    'L1 and L2',
                    'All three levels (L1–L2–L3)',
                  ]}
                  className="h-9 w-full"
                />
              </div>
            )}
            {taskType === 'design_flow' && (
              <div className="space-y-1.5">
                <Label htmlFor="job-map-detail">Process map detail</Label>
                <SelectField
                  id="job-map-detail"
                  value={String(advanced.mapDetail)}
                  onValueChange={(value) =>
                    onChange({ ...advanced, mapDetail: value })
                  }
                  options={['Concise', 'Balanced', 'Detailed']}
                  className="h-9 w-full"
                />
              </div>
            )}
            {taskType === 'generate_uml' && (
              <div className="space-y-1.5">
                <Label htmlFor="job-uml-detail">Diagram detail</Label>
                <SelectField
                  id="job-uml-detail"
                  value={String(advanced.diagramDetail)}
                  onValueChange={(value) =>
                    onChange({ ...advanced, diagramDetail: value })
                  }
                  options={['Standard', 'Detailed interactions']}
                  className="h-9 w-full"
                />
              </div>
            )}
            {taskType === 'generate_agent' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="job-tool-stubs"
                  checked={Boolean(advanced.includeToolStubs)}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...advanced,
                      includeToolStubs: checked === true,
                    })
                  }
                />
                <Label htmlFor="job-tool-stubs">
                  Include example tool stubs
                </Label>
              </div>
            )}
            {taskType === 'design_flow' && clusterOptions.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="job-cluster">Cluster to map</Label>
                <SelectField
                  id="job-cluster"
                  value={clusterTarget}
                  onValueChange={(value) =>
                    onChange({
                      ...advanced,
                      clusterTarget: value,
                      clusterName:
                        clusterOptions.find((option) => option.value === value)
                          ?.label ?? 'All clusters',
                    })
                  }
                  options={[
                    { value: 'all', label: 'All clusters' },
                    ...clusterOptions,
                  ]}
                  className="h-9 w-full"
                />
                <p className="text-xs text-muted">
                  Choose the branch for this process map. The selected cluster
                  is saved with the job configuration.
                </p>
              </div>
            )}
            <p className="text-xs leading-5 text-muted sm:col-span-2">
              These settings are saved with the job so teammates can understand
              how it was configured.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
