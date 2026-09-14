import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  PhoneCall,
  ClipboardList,
  CalendarClock,
  Route,
  History,
} from "lucide-react";
import { getLeadWorkspace } from "@/dal/leads";
import { PredictionPanel } from "@/components/prediction-panel";
import { LeadLifecycleActions } from "@/components/lead-lifecycle-actions";
import { EmptyState, IssueBanner } from "@/components/states";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatRelative,
  humanize,
  orDash,
} from "@/lib/format";

/**
 * Lead workspace.
 *
 * Everything on this page comes from a single GET /api/leads/{id}/details call,
 * which the backend assembles from the lead, customer, campaign, assignment,
 * engagement, journey, AI, call, task, follow-up, outcome and timeline modules.
 */
export default async function LeadWorkspacePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId: rawLeadId } = await params;
  const leadId = Number(rawLeadId);
  if (!Number.isInteger(leadId) || leadId < 1) notFound();

  const result = await getLeadWorkspace(leadId);

  // A 404 is the expected answer for an id that does not exist; anything else
  // (a stopped backend, a 500) is reported rather than disguised as "missing".
  if (!result.ok) {
    if (result.notFound) notFound();
    return (
      <div className="space-y-6">
        <BackLink />
        <IssueBanner
          issues={[
            {
              source: `leads/${leadId}/details`,
              message: result.message,
              unreachable: true,
            },
          ]}
        />
      </div>
    );
  }

  const { workspace } = result;
  const { lead, customer, campaign, assignment, engagement } = workspace;

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <BackLink />

      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Lead #{lead.id}
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {lead.customerRef}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {humanize(lead.channel)} · {humanize(lead.stage)} ·{" "}
            {orDash(lead.section)} · owned by {lead.handler}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge label="Status" value={humanize(lead.status)} />
          <Badge label="Priority" value={humanize(lead.priority)} />
          <Badge
            label="Score"
            value={lead.score === null ? "Unscored" : lead.score.toFixed(0)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Customer" icon={Activity} className="lg:col-span-1">
          {customer ? (
            <dl className="space-y-1.5 text-xs">
              <Row label="Customer_ID" value={customer.customerRef} />
              <Row label="Age band" value={customer.ageBand} />
              <Row label="Income band" value={customer.incomeBand} />
              <Row label="Occupation" value={customer.occupation} />
              <Row label="Education" value={customer.education} />
              <Row label="Gender" value={customer.gender} />
              <Row label="Tobacco" value={customer.tobaccoUser} />
              <Row label="Non-resident" value={customer.nonResident} />
              <Row label="Existing plan" value={customer.existingPlan} />
            </dl>
          ) : (
            <p className="text-xs text-slate-500">No customer linked.</p>
          )}
        </Panel>

        <Panel title="Attribution" icon={Route} className="lg:col-span-1">
          <dl className="space-y-1.5 text-xs">
            <Row label="Channel" value={humanize(lead.channel)} />
            <Row label="Medium" value={humanize(lead.medium)} />
            <Row label="Campaign" value={campaign ? campaign.name : "—"} />
            <Row label="Campaign code" value={campaign ? campaign.code : "—"} />
            <Row
              label="Recommended"
              value={lead.recommendedAction ? humanize(lead.recommendedAction) : "—"}
            />
            <Row label="Created" value={formatDateTime(lead.createdAt)} />
            <Row label="Updated" value={formatRelative(lead.updatedAt)} />
          </dl>
        </Panel>

        <Panel title="Engagement" icon={Activity} className="lg:col-span-1">
          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {formatNumber(engagement.totalEvents)}
            </span>
            <span className="text-xs text-slate-500">
              events · {formatNumber(engagement.totalMetricValue)} engaged
            </span>
          </div>
          {engagement.byChannel.length === 0 ? (
            <p className="text-xs text-slate-500">No engagement recorded.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {engagement.byChannel.map((item) => (
                <li key={item.channel} className="flex justify-between">
                  <span className="text-slate-500">{humanize(item.channel)}</span>
                  <span className="font-medium tabular-nums text-slate-900">
                    {formatNumber(item.events)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <PredictionPanel
        leadId={lead.id}
        initialPredictions={workspace.latestPredictions}
        initialDecisions={workspace.recentDecisions}
      />

      <LeadLifecycleActions
        leadId={lead.id}
        currentSection={lead.section}
        currentHandler={lead.handler}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Calls" icon={PhoneCall}>
          {workspace.calls.length === 0 ? (
            <EmptyState title="No calls logged" />
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {workspace.calls.map((call) => (
                <li key={call.id} className="flex justify-between py-2">
                  <div>
                    <span className="font-medium text-slate-900">
                      {humanize(call.status)}
                    </span>
                    <span className="ml-2 text-slate-400">
                      {humanize(call.direction)}
                    </span>
                  </div>
                  <div className="text-right text-slate-500">
                    <span className="block">{formatDuration(call.durationSeconds)}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelative(call.scheduledAt ?? call.startedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Tasks" icon={ClipboardList}>
          {workspace.tasks.length === 0 ? (
            <EmptyState title="No tasks" />
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {workspace.tasks.map((task) => (
                <li key={task.id} className="flex justify-between py-2">
                  <div className="min-w-0 pr-3">
                    <span className="block truncate font-medium text-slate-900">
                      {task.title}
                    </span>
                    {task.description ? (
                      <span className="block truncate text-[11px] text-slate-500">
                        {task.description}
                      </span>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {humanize(task.status)}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {task.dueAt ? formatRelative(task.dueAt) : "no due date"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Follow-ups" icon={CalendarClock}>
          {workspace.followups.length === 0 ? (
            <EmptyState title="No follow-ups" />
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {workspace.followups.map((followup) => (
                <li key={followup.id} className="flex justify-between py-2">
                  <div>
                    <span className="font-medium text-slate-900">
                      {humanize(followup.channel)}
                    </span>
                    {followup.notes ? (
                      <span className="block text-[11px] text-slate-500">
                        {followup.notes}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-right text-slate-500">
                    <span className="block">{humanize(followup.status)}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelative(followup.scheduledAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Website journey" icon={Route}>
          {workspace.journey.length === 0 ? (
            <EmptyState title="No website activity" />
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {workspace.journey.slice(0, 12).map((step) => (
                <li key={step.id} className="flex justify-between py-2">
                  <div>
                    <span className="font-medium text-slate-900">
                      {humanize(step.eventName)}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {orDash(step.stepName)}
                      {step.stepNumber !== null ? ` · step ${step.stepNumber}` : ""}
                    </span>
                  </div>
                  <div className="text-right text-slate-500">
                    <span className="block">{orDash(step.deviceType)}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelative(step.at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Timeline" icon={History}>
        {workspace.timeline.length === 0 ? (
          <EmptyState title="No lifecycle events recorded" />
        ) : (
          <ol className="space-y-3">
            {workspace.timeline.map((event) => (
              <li key={event.id} className="flex gap-3 text-xs">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {humanize(event.eventType)}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatDateTime(event.at)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    via {humanize(event.eventSource)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {assignment ? (
        <p className="text-[11px] text-slate-500">
          Current assignment: {orDash(assignment.handler)} in{" "}
          {orDash(assignment.section)} ({humanize(assignment.assignmentType)},{" "}
          {formatRelative(assignment.at)})
          {assignment.reason ? ` — ${assignment.reason}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/leads"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-blue-600"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to lead queue
    </Link>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs ${className}`}
    >
      <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Icon className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-50 py-1 last:border-0">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="truncate text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 shadow-2xs">
      <span className="text-slate-400">{label}: </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </span>
  );
}
