import type { ReactNode } from "react";

interface ChartPoint {
  label: string;
  value: number;
}

interface ChatChart {
  type: "bar" | "line";
  title: string;
  metric: string;
  data: ChartPoint[];
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    if (match[1]) {
      parts.push(
        <strong key={key++} className="font-semibold text-slate-800">
          {match[1]}
        </strong>,
      );
    } else {
      parts.push(
        <code
          key={key++}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {match[2]}
        </code>,
      );
    }
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function parseChart(value: unknown): ChatChart | null {
  if (!value || typeof value !== "object") return null;
  const chart = value as Record<string, unknown>;
  if (
    (chart.type !== "bar" && chart.type !== "line") ||
    typeof chart.title !== "string" ||
    typeof chart.metric !== "string" ||
    !Array.isArray(chart.data) ||
    chart.data.length === 0 ||
    chart.data.length > 24
  ) {
    return null;
  }

  const data = chart.data.filter(
    (point): point is ChartPoint =>
      !!point &&
      typeof point === "object" &&
      typeof (point as Record<string, unknown>).label === "string" &&
      typeof (point as Record<string, unknown>).value === "number" &&
      Number.isFinite((point as Record<string, number>).value) &&
      (point as Record<string, number>).value >= 0,
  );
  if (data.length !== chart.data.length) return null;

  return {
    type: chart.type,
    title: chart.title,
    metric: chart.metric,
    data,
  };
}

function ChatChartView({ chart }: { chart: ChatChart }) {
  const width = Math.max(620, chart.data.length * 64);
  const height = 270;
  const left = 46;
  const right = width - 18;
  const top = 18;
  const bottom = height - 42;
  const maxValue = Math.max(1, ...chart.data.map((point) => point.value));
  const formatValue = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);
  const slot = (right - left) / chart.data.length;
  const points = chart.data.map((point, index) => ({
    ...point,
    x: left + slot * (index + 0.5),
    y: bottom - (point.value / maxValue) * (bottom - top),
  }));
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <figcaption className="mb-3 text-sm font-semibold text-slate-800">
        {chart.title}
        <span className="ml-2 text-xs font-normal text-slate-500">
          {chart.metric}
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={`${chart.title}, ${chart.metric}`}
          viewBox={`0 0 ${width} ${height}`}
          className="h-[250px] w-full min-w-[620px]"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = bottom - fraction * (bottom - top);
            return (
              <g key={fraction}>
                <line
                  x1={left}
                  x2={right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={fraction === 0 ? undefined : "3 4"}
                />
                <text
                  x={left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {formatValue(maxValue * fraction)}
                </text>
              </g>
            );
          })}
          {chart.type === "bar" ? (
            points.map((point) => (
              <g key={point.label}>
                <rect
                  x={point.x - slot * 0.28}
                  y={point.y}
                  width={slot * 0.56}
                  height={Math.max(1, bottom - point.y)}
                  rx="4"
                  fill="#2563eb"
                >
                  <title>{`${point.label}: ${formatValue(point.value)}`}</title>
                </rect>
                <text
                  x={point.x}
                  y={bottom + 17}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                >
                  <title>{point.label}</title>
                  {point.label.length > 12
                    ? `${point.label.slice(0, 11)}…`
                    : point.label}
                </text>
              </g>
            ))
          ) : (
            <>
              <polyline
                points={linePoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#2563eb">
                    <title>{`${point.label}: ${formatValue(point.value)}`}</title>
                  </circle>
                  <text
                    x={point.x}
                    y={bottom + 17}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </>
          )}
        </svg>
      </div>
    </figure>
  );
}

export function AIChatResponse({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line === "```salesboard-chart") {
      const start = index + 1;
      let end = start;
      while (end < lines.length && lines[end].trim() !== "```") end += 1;
      const rawChart = lines.slice(start, end).join("\n");
      let chart: ChatChart | null = null;
      try {
        chart = parseChart(JSON.parse(rawChart));
      } catch {
        chart = null;
      }
      if (chart) {
        blocks.push(<ChatChartView key={`chart-${index}`} chart={chart} />);
      } else {
        blocks.push(
          <pre
            key={`chart-error-${index}`}
            className="my-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700"
          >
            {rawChart}
          </pre>,
        );
      }
      index = end < lines.length ? end + 1 : end;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      const rows = tableLines
        .filter((row) => !/^\|?[\s:|-]+\|?$/.test(row))
        .map((row) =>
          row
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((cell) => cell.trim()),
        );
      if (rows.length) {
        blocks.push(
          <div
            key={`table-${index}`}
            className="my-3 overflow-x-auto rounded-lg border border-slate-200"
          >
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {rows[0].map((cell, cellIndex) => (
                    <th key={cellIndex} className="px-3 py-2">
                      {renderInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {rows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {rows[0].map((_, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 align-top">
                        {renderInlineMarkdown(row[cellIndex] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      }
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push(
        <h3
          key={`heading-${index}`}
          className="mb-1 mt-4 text-sm font-semibold text-slate-900 first:mt-0"
        >
          {renderInlineMarkdown(heading[2])}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (/^(?:[-*]\s+|\d+[.)]\s+)/.test(line)) {
      const items: string[] = [];
      const ordered = /^\d+[.)]\s+/.test(line);
      while (
        index < lines.length &&
        (ordered
          ? /^\d+[.)]\s+/.test(lines[index].trim())
          : /^[-*]\s+/.test(lines[index].trim()))
      ) {
        items.push(lines[index].trim().replace(/^(?:[-*]\s+|\d+[.)]\s+)/, ""));
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List
          key={`list-${index}`}
          className={`my-2 space-y-1 pl-5 text-sm leading-6 text-slate-700 ${
            ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </List>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(?:#{1,4}\s+|[-*]\s+|\d+[.)]\s+|\|)/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p
        key={`paragraph-${index}`}
        className="my-2 text-sm leading-7 text-slate-700 first:mt-0"
      >
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>,
    );
  }
  return <>{blocks}</>;
}
