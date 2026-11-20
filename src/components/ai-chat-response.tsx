import type { ReactNode } from "react";

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
