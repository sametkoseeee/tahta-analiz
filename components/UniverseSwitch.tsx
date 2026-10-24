"use client";

import { indexLabel, QUICK_INDICES, type IndexFilter } from "@/lib/indices";

export default function UniverseSwitch({ value, onChange }: { value: IndexFilter; onChange: (u: IndexFilter) => void }) {
  return (
    <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs" title="Resmi BIST endeks bileşenleri (kaynak: KAP)">
      {QUICK_INDICES.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`whitespace-nowrap rounded-md px-2.5 py-1 ${value === code ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
        >
          {indexLabel(code)}
        </button>
      ))}
    </div>
  );
}
