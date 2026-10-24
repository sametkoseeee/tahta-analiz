"use client";

import { useMemo, useState } from "react";
import { filterByIndex, type IndexFilter } from "@/lib/indices";
import type { CompanySummary } from "@/lib/types";
import CompaniesTable from "./CompaniesTable";
import UniverseSwitch from "./UniverseSwitch";

export default function HomeList({ companies }: { companies: CompanySummary[] }) {
  const sectors = useMemo(
    () => [...new Set(companies.map((c) => c.sector))].sort((a, b) => a.localeCompare(b, "tr")),
    [companies],
  );
  const [index, setIndex] = useState<IndexFilter>("XU100");
  const [sector, setSector] = useState("");
  const list = useMemo(() => {
    const inIndex = filterByIndex(companies, index);
    return sector ? inIndex.filter((c) => c.sector === sector) : inIndex;
  }, [companies, index, sector]);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Hisseler</h2>
        <UniverseSwitch value={index} onChange={setIndex} />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-xs"
          aria-label="Sektör"
        >
          <option value="">Tüm sektörler</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">{list.length} şirket</span>
      </div>
      <CompaniesTable
        companies={list}
        columns={["price", "change", "change1y", "marketCap", "pe", "pb", "evEbitda", "roe", "netMargin"]}
      />
    </section>
  );
}
