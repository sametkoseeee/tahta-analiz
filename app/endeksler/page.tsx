import type { Metadata } from "next";
import IndicesTable from "@/components/IndicesTable";
import { getIndicesData } from "@/lib/indices-data";

export const metadata: Metadata = {
  title: "Borsa İstanbul Endeksleri",
  description: "BIST 100, BIST 30, XBANK, XUSIN ve tüm sektör endekslerinin son değeri, günlük ve dönemsel getirileri",
};

export default function IndicesPage() {
  const { rows } = getIndicesData();
  const date = rows[0]?.date.split("-").reverse().join(".");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Borsa İstanbul Endeksleri</h1>
        <p className="mt-1 text-sm text-muted">
          Ana, sektör ve katılım endekslerinin son değeri, günlük değişimi ve dönemsel getirileri. Bir sütun başlığına
          tıklayarak sıralayabilirsin.
        </p>
      </div>
      {rows.length > 0 ? (
        <IndicesTable rows={rows} />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Endeks verisi henüz yüklenmedi.</div>
      )}
      <p className="text-xs text-muted">
        Değerler {date ? `${date} kapanışı` : "son kapanış"}, kaynak Yahoo Finance; her akşam güncellenir. Uzun geçmişi
        olmayan endekslerde dönemsel getiriler, kayıt biriktikçe dolar (ör. 1 haftalık getiri bir hafta sonra). Şirket
        sayısı ve piyasa değeri yalnızca üyeleri KAP&apos;ta yayımlanan ana endeksler için gösterilir. Yatırım tavsiyesi
        değildir.
      </p>
    </div>
  );
}
