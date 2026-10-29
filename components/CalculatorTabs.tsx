"use client";

import { useEffect, useState } from "react";
import CapitalCalculator, { type CalcPreset } from "./CapitalCalculator";
import CostCalculator from "./CostCalculator";
import RightsCalculator from "./RightsCalculator";

const TABS = [
  { key: "sermaye", label: "Sermaye artırımı" },
  { key: "ruchan", label: "Rüçhan hakkı" },
  { key: "maliyet", label: "Hisse maliyet" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/** Hesaplama araçları sekmeleri; seçili sekme adreste (#ruchan) tutulur ki paylaşılabilsin */
export default function CalculatorTabs({ presets }: { presets: CalcPreset[] }) {
  const [tab, setTab] = useState<Tab>("sermaye");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (TABS.some((t) => t.key === h)) setTab(h as Tab);
  }, []);
  const select = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => select(t.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "sermaye" && <CapitalCalculator presets={presets} />}
      {tab === "ruchan" && <RightsCalculator presets={presets} />}
      {tab === "maliyet" && <CostCalculator />}
    </div>
  );
}
