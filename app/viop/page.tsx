import type { Metadata } from "next";
import ViopTable from "@/components/ViopTable";
import { getViop } from "@/lib/viop";

export const metadata: Metadata = {
  title: "VİOP Teminat Tablosu",
  description: "VİOP vadeli işlem sözleşmelerinin yaklaşık başlangıç teminatı ve kaldıraç oranları (Takasbank PSR)",
};

export default function ViopPage() {
  const { rows, source } = getViop();
  const paramDate = source?.match(/(\d{2})(\d{2})(\d{4})\.xlsx$/);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">VİOP Teminat Tablosu</h1>
        <p className="mt-1 text-sm text-muted">
          Vadeli işlem sözleşmelerinde bir kontrat pozisyon açmak için gereken yaklaşık başlangıç teminatı ve kaldıraç
          oranı. Teminat ≈ spot fiyat × kontrat büyüklüğü × PSR; kaldıraç ≈ 1 / PSR.
        </p>
      </div>
      {rows.length > 0 ? (
        <ViopTable rows={rows} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">VİOP verisi henüz yüklenmedi.</div>
      )}
      <div className="space-y-1 text-xs text-muted">
        <p>
          <strong>Yaklaşık değerdir.</strong> Hesap, VİOP kontrat (vade) fiyatı yerine dayanak varlığın spot fiyatıyla
          yapılır; gerçek teminat vade fiyatına göre biraz farklıdır. Takasbank teminatı portföy bazında hesaplar ve aracı
          kurumunuz daha yüksek teminat isteyebilir. Yatırım tavsiyesi değildir.
        </p>
        <p>
          Teminat oranları (PSR):{" "}
          {source ? (
            <a href={source} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              Takasbank BISTECH risk parametre tablosu
            </a>
          ) : (
            "Takasbank"
          )}
          {paramDate && ` (${paramDate[1]}.${paramDate[2]}.${paramDate[3]})`}. Kontrat büyüklükleri: Borsa İstanbul VİOP
          sözleşme özellikleri. Spot fiyatlar yaklaşık 15 dakika gecikmelidir.
        </p>
      </div>
    </div>
  );
}
