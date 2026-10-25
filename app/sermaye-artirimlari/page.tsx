import type { Metadata } from "next";
import CapitalTable from "@/components/CapitalTable";
import { getCapitalActions } from "@/lib/data";

export const metadata: Metadata = { title: "Sermaye Artırımları" };

export default function CapitalPage() {
  const { rows, updatedAt } = getCapitalActions();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sermaye Artırımları</h1>
        <p className="mt-1 text-sm text-muted">
          Bedelli, bedelsiz ve tahsisli sermaye artırımları ile azaltımlar; KAP bildirimlerinden derlenir.
          {updatedAt && ` Son güncelleme: ${new Date(updatedAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}.`}
        </p>
      </div>
      <CapitalTable rows={rows} />
    </div>
  );
}
