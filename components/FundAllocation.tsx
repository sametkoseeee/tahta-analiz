"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationItem } from "@/lib/allocation";
import { num } from "@/lib/format";

/** Her grup her fonda aynı renkte görünsün */
const GROUP_COLORS: Record<string, string> = {
  Hisse: "#2563eb",
  "Yabancı hisse": "#7c3aed",
  "Devlet borçlanma": "#16a34a",
  "Dış borçlanma (Eurobond)": "#0891b2",
  "Özel sektör borçlanma": "#65a30d",
  "Kira sertifikası": "#ca8a04",
  "Mevduat / katılım": "#ea580c",
  "Repo / para piyasası": "#db2777",
  "Kıymetli maden": "#eab308",
  "Fon payları": "#6366f1",
  Diğer: "#94a3b8",
};

const dateTr = (d: string) => d.split("-").reverse().join(".");

export default function FundAllocation({
  items,
  groups,
  date,
}: {
  items: AllocationItem[];
  groups: { group: string; pct: number }[];
  date: string | null;
}) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Portföy Dağılımı</h2>
        {date && <span className="text-xs text-muted">{dateTr(date)} itibarıyla · TEFAS</span>}
      </div>
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <div className="mx-auto h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={groups} dataKey="pct" nameKey="group" innerRadius={55} outerRadius={95} paddingAngle={1} stroke="none">
                  {groups.map((g) => (
                    <Cell key={g.group} fill={GROUP_COLORS[g.group] ?? GROUP_COLORS.Diğer} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [`%${num(v)}`, name]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "var(--text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1 text-xs">
            {groups.map((g) => (
              <li key={g.group} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: GROUP_COLORS[g.group] ?? GROUP_COLORS.Diğer }} />
                <span className="min-w-0 flex-1 truncate">{g.group}</span>
                <span className="tabular font-medium">%{num(g.pct)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Varlık türü</span>
            <span>Oran</span>
          </div>
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0">{i.label}</span>
                  <span className="shrink-0 tabular font-medium">%{num(i.pct)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, i.pct)}%`, background: GROUP_COLORS[i.group] ?? GROUP_COLORS.Diğer }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">
        Fonun parasının hangi varlık türlerinde durduğunu gösterir. Fonun tek tek hangi hisse ya da tahvilleri tuttuğu bu
        dağılımda yer almaz.
      </p>
    </section>
  );
}
