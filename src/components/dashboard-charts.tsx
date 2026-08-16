"use client";

import React, { useState } from "react";
import { MonthlyTrend, ProductPerformance } from "@/dal/types";
import { TrendingUp, ShieldCheck } from "lucide-react";

interface RevenueChartProps {
  data: MonthlyTrend[];
}

export function RevenueTrendChart({ data }: RevenueChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.target))) * 1.15;
  const svgWidth = 560;
  const svgHeight = 180;
  const paddingX = 35;
  const paddingY = 20;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.revenue / maxVal) * chartH;
    return { x, y, data: d };
  });

  const targetPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const y = svgHeight - paddingY - (d.target / maxVal) * chartH;
    return { x, y };
  });

  // Smooth Bezier Curve Path
  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${
    points[0].x
  } ${svgHeight - paddingY} Z`;

  const targetPathD = targetPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div className="border border-slate-200 bg-white p-5 rounded-xl flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 block mb-0.5">
            Revenue Performance
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            Monthly Pacing vs Target (₹ Cr)
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="h-2 w-3 rounded-xs bg-blue-600 inline-block" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-px w-3 border-t-2 border-dashed border-slate-300 inline-block" />
            <span>Target</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="lightBlueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = svgHeight - paddingY - ratio * chartH;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-medium"
                >
                  {(ratio * maxVal).toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#lightBlueGrad)" />

          {/* Target Line */}
          <path
            d={targetPathD}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Main Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx} className="cursor-pointer">
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingY}
                    x2={p.x}
                    y2={svgHeight - paddingY}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : 3.5}
                  fill="white"
                  stroke="#2563eb"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                <text
                  x={p.x}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    isHovered ? "fill-blue-600 font-bold" : "fill-slate-500 font-medium"
                  }`}
                >
                  {p.data.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs flex items-center gap-3 animate-in fade-in">
            <div>
              <span className="text-slate-500 block text-[10px]">
                {data[hoveredIdx].month} Revenue
              </span>
              <span className="text-blue-600 font-bold tabular-nums">
                ₹{data[hoveredIdx].revenue} Cr
              </span>
            </div>
            <div className="border-l border-slate-100 pl-2.5">
              <span className="text-slate-500 block text-[10px]">Target</span>
              <span className="text-slate-900 font-semibold tabular-nums">₹{data[hoveredIdx].target} Cr</span>
            </div>
            <div className="border-l border-slate-100 pl-2.5">
              <span className="text-slate-500 block text-[10px]">Policies</span>
              <span className="text-slate-900 font-semibold tabular-nums">{data[hoveredIdx].policiesSold}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-blue-600 font-medium">Audited Monthly Pipeline</span>
        <span className="tabular-nums">Pacing: +14.8% MTD</span>
      </div>
    </div>
  );
}

interface ProductDistributionProps {
  data: ProductPerformance[];
}

export function ProductDistributionChart({ data }: ProductDistributionProps) {
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const productColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

  let currentOffset = 0;
  const segments = data.map((item, i) => {
    const color = productColors[i % productColors.length];
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (item.percentage / 100) * circumference;
    return {
      ...item,
      color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="border border-slate-200 bg-white p-5 rounded-xl flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 block mb-0.5">
          Product Distribution
        </span>
        <h3 className="text-sm font-semibold text-slate-900">
          Portfolio Revenue Share
        </h3>
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center justify-center gap-5">
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              Total MTD
            </span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              ₹4.82 Cr
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-1.5">
          {segments.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-0.5 border-b border-slate-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 text-xs font-medium truncate">
                  {item.product}
                </span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-blue-600 font-medium">Leading: Life (35%)</span>
        <span>5 Categories Active</span>
      </div>
    </div>
  );
}
