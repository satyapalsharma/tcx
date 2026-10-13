'use client';

import { useState } from 'react';
import type {
  ClusterMetric,
  CostInputs,
  TranscriptSummary,
} from '@/lib/job-analytics';
import { estimateAutomation } from '@/lib/job-analytics';
import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/common';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Props = {
  clusters: ClusterMetric[];
  summary: TranscriptSummary;
  sample: boolean;
  defaultClusterId?: string;
};
const money = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export function CostEstimator({
  clusters,
  summary,
  sample,
  defaultClusterId,
}: Props) {
  const candidates = clusters;
  const [clusterId, setClusterId] = useState(defaultClusterId ?? '');
  const [monthlyConversations, setMonthlyConversations] = useState(
    String(summary.conversationCount),
  );
  const [costPerMinute, setCostPerMinute] = useState('0');
  const [implementationCost, setImplementationCost] = useState('0');
  const [monthlyRunningCost, setMonthlyRunningCost] = useState('0');
  const [avgHandlingMinutes, setAvgHandlingMinutes] = useState(
    String(Number(summary.averageHandlingMinutes.toFixed(1))),
  );
  const [currency, setCurrency] = useState('USD');
  const target =
    candidates.find((cluster) => cluster.id === clusterId) ??
    candidates.reduce<ClusterMetric | undefined>(
      (best, cluster) =>
        !best || cluster.volume > best.volume ? cluster : best,
      undefined,
    );
  const nonnegative = (value: string) =>
    Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const inputs: CostInputs = {
    monthlyConversations:
      nonnegative(monthlyConversations) * (target?.coverage ?? 0),
    costPerMinute: nonnegative(costPerMinute),
    implementationCost: nonnegative(implementationCost),
    monthlyRunningCost: nonnegative(monthlyRunningCost),
    currency,
    avgHandlingMinutes: nonnegative(avgHandlingMinutes),
  };
  const estimate = target ? estimateAutomation(target, inputs) : null;
  const field = (
    id: string,
    label: string,
    value: string,
    update: (value: string) => void,
    min = '0',
    step = '1',
  ) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(event) => update(event.target.value)}
        className="h-9"
      />
    </div>
  );

  return (
    <Card className="space-y-4 border-border p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-base font-semibold">
            Cost and automation estimate
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            An editable planning scenario based on the selected job’s observed
            metrics.
          </p>
        </div>
        {sample && (
          <span className="w-fit rounded-md bg-accent-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
            Sample data
          </span>
        )}
      </div>
      <Accordion
        type="single"
        collapsible
        className="rounded-lg border border-border px-3"
      >
        <AccordionItem value="scenario" className="border-0">
          <AccordionTrigger className="py-3 text-sm hover:no-underline">
            Configure ROI scenario · all cluster levels
          </AccordionTrigger>
          <AccordionContent>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label
                  htmlFor="estimate-cluster"
                  className="text-xs text-muted"
                >
                  Estimate for cluster
                </Label>
                <SelectField
                  id="estimate-cluster"
                  value={target?.id ?? ''}
                  onValueChange={setClusterId}
                  options={candidates.map((cluster) => ({
                    value: cluster.id,
                    label: `${cluster.level} · ${[cluster.l1, cluster.l2, cluster.l3].filter(Boolean).join(' / ')}`,
                  }))}
                  className="h-9 w-full"
                  size="default"
                />
              </div>
              {field(
                'estimate-volume',
                'Monthly conversations (job total)',
                monthlyConversations,
                setMonthlyConversations,
              )}
              {field(
                'estimate-minute-cost',
                `Labor cost per handling minute (${currency})`,
                costPerMinute,
                setCostPerMinute,
                '0',
                '0.01',
              )}
              {field(
                'estimate-handling-time',
                'Average handling minutes',
                avgHandlingMinutes,
                setAvgHandlingMinutes,
                '0',
                '0.1',
              )}
              {field(
                'estimate-running-cost',
                `Estimated monthly running cost (${currency})`,
                monthlyRunningCost,
                setMonthlyRunningCost,
              )}
              {field(
                'estimate-implementation',
                `Estimated implementation cost (${currency})`,
                implementationCost,
                setImplementationCost,
              )}
              <div className="space-y-1">
                <Label
                  htmlFor="estimate-currency"
                  className="text-xs text-muted"
                >
                  Currency
                </Label>
                <SelectField
                  id="estimate-currency"
                  value={currency}
                  onValueChange={setCurrency}
                  options={[
                    { value: 'USD', label: 'USD · US dollar' },
                    { value: 'INR', label: 'INR · Indian rupee' },
                    { value: 'EUR', label: 'EUR · Euro' },
                    { value: 'GBP', label: 'GBP · Pound sterling' },
                  ]}
                  className="h-9 w-full"
                  size="default"
                />
              </div>
            </div>
            {estimate ? (
              <>
                <p className="text-xs text-muted">
                  Estimated monthly conversations in this cluster:{' '}
                  {Math.round(
                    nonnegative(monthlyConversations) * (target?.coverage ?? 0),
                  ).toLocaleString()}{' '}
                  of {nonnegative(monthlyConversations).toLocaleString()} total,
                  using {((target?.coverage ?? 0) * 100).toFixed(1)}% coverage.
                </p>
                <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted">
                      Estimated automatic rate
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {(estimate.automaticRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Monthly gross savings</p>
                    <p className="mt-1 text-lg font-semibold">
                      {money(estimate.monthlyGrossSavings, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Monthly net savings</p>
                    <p className="mt-1 text-lg font-semibold">
                      {money(estimate.monthlyNetSavings, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Payback · annual ROI</p>
                    <p className="mt-1 text-lg font-semibold">
                      {estimate.paybackMonths === null
                        ? '—'
                        : `${estimate.paybackMonths.toFixed(1)} mo`}{' '}
                      ·{' '}
                      {estimate.annualRoi === null
                        ? 'set build cost'
                        : `${estimate.annualRoi.toFixed(0)}%`}
                    </p>
                  </div>
                </div>
                <Accordion
                  type="single"
                  collapsible
                  className="rounded-lg border border-border px-3"
                >
                  <AccordionItem value="calculation" className="border-0">
                    <AccordionTrigger className="py-2.5 text-xs font-medium text-muted hover:no-underline">
                      How this estimate is calculated
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border pt-3 text-xs leading-5 text-muted">
                      <div className="space-y-1">
                        <p>
                          Estimated automatic rate = automation potential × (1 −
                          complexity ÷ 200). Gross savings = monthly
                          conversations × handling minutes × labor cost per
                          minute × automatic rate.
                        </p>
                        <p>
                          Net savings subtract monthly running cost. Annual ROI
                          subtracts implementation cost from 12 months of net
                          savings. Payback is implementation cost divided by
                          monthly net savings.
                        </p>
                        {estimate.assumptions.map((assumption) => (
                          <p key={assumption}>• {assumption}</p>
                        ))}
                        <p>
                          These are configurable estimates, not backend-reported
                          savings or a forecast. Actual results depend on
                          adoption and operating costs.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            ) : (
              <p className="border-t border-border pt-3 text-xs text-muted">
                No cluster is available for an estimate yet.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
