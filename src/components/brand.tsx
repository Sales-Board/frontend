import React from "react";

export function BrandIcon({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 shadow-xs hover:border-blue-500 transition-colors"
    >
      <span className="text-blue-600">S</span>B
      <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
    </div>
  );
}

export function BrandWordmark() {
  return (
    <div className="flex flex-col select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          sales<span className="text-blue-600">:</span>board
        </span>
      </div>
      <span className="text-[11px] text-slate-500 tracking-normal mt-0.5 font-normal">
        Sales Intelligence
      </span>
    </div>
  );
}
