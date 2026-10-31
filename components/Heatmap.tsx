"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { compact, num, signedPct } from "@/lib/format";
import { INDEX_NAMES } from "@/lib/indices";
import { useLiveCompanies } from "@/lib/live";
import type { CompanySummary } from "@/lib/types";

/** Isı haritası için gereken alanlar; metrics'te yalnızca fiyat, değişim ve piyasa değeri dolu (sayfa hafif kalsın) */
export type HeatItem = Pick<CompanySummary, "code" | "name" | "sector" | "indices" | "metrics">;

const FILTERS = ["XU030", "XU100", "all"] as const;
type Filter = (typeof FILTERS)[number];

/** Günlük değişime göre renk: ±%5 ve üstü en koyu */
function color(change: number | null): string {
  if (change == null) return "#64748b";
  const t = Math.min(Math.abs(change) / 0.05, 1);
  const up = change >= 0;
  // Nötr griden yeşile / kırmızıya
  const from = [100, 116, 139];
  const to = up ? [22, 163, 74] : [220, 38, 38];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * (0.35 + 0.65 * t)));
  return `rgb(${c.join(",")})`;
}

type Node = { name: string; size?: number; change?: number | null; label?: string; children?: Node[] };

type CellProps = { x: number; y: number; width: number; height: number; depth: number; name: string; change?: number | null };

function Cell({ x, y, width, height, depth, name, change }: CellProps) {
  if (depth === 1) {
    // Sektör çerçevesi ve adı
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill="none" stroke="var(--bg, #0b1220)" strokeWidth={3} />
        {width > 70 && height > 22 && (
          <text x={x + 5} y={y + 13} fill="#fff" fontSize={10} fontWeight={700} opacity={0.85} style={{ pointerEvents: "none" }}>
            {name.length > width / 6 ? `${name.slice(0, Math.floor(width / 6))}…` : name}
          </text>
        )}
      </g>
    );
  }
  if (depth !== 2) return null;
  const big = width > 46 && height > 30;
  return (
    <g style={{ cursor: "pointer" }}>
      <rect x={x} y={y} width={width} height={height} fill={color(change ?? null)} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
      {big && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 2} textAnchor="middle" fill="#fff" fontSize={Math.min(16, width / 4.5)} fontWeight={700} style={{ pointerEvents: "none" }}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fill="#fff" fontSize={Math.min(12, width / 6)} opacity={0.9} style={{ pointerEvents: "none" }}>
            {change != null ? signedPct(change) : ""}
          </text>
        </>
      )}
    </g>
  );
}

export default function Heatmap({ companies: base }: { companies: HeatItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("XU100");
  const companies = useLiveCompanies(base);

  const { data, byCode } = useMemo(() => {
    const list = companies.filter(
      (c) => c.metrics.marketCap && (filter === "all" || c.indices?.includes(filter)),
    );
    const sectors = new Map<string, Node[]>();
    for (const c of list) {
      // Düzeltilmemiş bölünme / bedelsiz kaynaklı imkânsız değişim gösterilmez
      const ch = c.metrics.change != null && Math.abs(c.metrics.change) <= 0.25 ? c.metrics.change : null;
      const arr = sectors.get(c.sector) ?? [];
      arr.push({ name: c.code, size: c.metrics.marketCap!, change: ch });
      sectors.set(c.sector, arr);
    }
    const data: Node[] = [...sectors.entries()]
      .map(([name, children]) => ({ name, children: children.sort((a, b) => b.size! - a.size!) }))
      .sort((a, b) => b.children.reduce((s, n) => s + n.size!, 0) - a.children.reduce((s, n) => s + n.size!, 0));
    return { data, byCode: new Map(list.map((c) => [c.code, c])) };
  }, [companies, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 ${filter === f ? "bg-surface font-semibold shadow-sm" : "text-muted hover:text-text"}`}
            >
              {f === "all" ? "Tümü" : INDEX_NAMES[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          <span>-%5</span>
          {[-0.05, -0.025, -0.005, 0, 0.005, 0.025, 0.05].map((v) => (
            <span key={v} className="h-3 w-5 rounded-sm" style={{ background: color(v) }} />
          ))}
          <span>+%5</span>
        </div>
      </div>
      <div className="card h-[560px] overflow-hidden p-1 sm:h-[640px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            isAnimationActive={false}
            content={<Cell x={0} y={0} width={0} height={0} depth={0} name="" />}
            onClick={(n: { depth?: number; name?: string }) => {
              if (n?.depth === 2 && n.name) router.push(`/sirketler/${n.name}`);
            }}
          >
            <Tooltip
              content={({ payload }) => {
                const p = payload?.[0]?.payload as { name?: string; depth?: number } | undefined;
                const c = p?.name ? byCode.get(p.name) : undefined;
                if (!c) return null;
                return (
                  <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
                    <div className="font-semibold">{c.code}</div>
                    <div className="max-w-56 truncate text-muted">{c.name}</div>
                    <div className="mt-1 tabular">
                      {num(c.metrics.price)} ₺ · <span>{signedPct(c.metrics.change)}</span>
                    </div>
                    <div className="text-muted tabular">Piyasa değeri {compact(c.metrics.marketCap)} ₺</div>
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted">
        Kutuların büyüklüğü piyasa değerini, rengi günlük değişimi gösterir; şirketler sektörlerine göre gruplanır.
        Kutuya tıklayınca şirket sayfası açılır.
      </p>
    </div>
  );
}
