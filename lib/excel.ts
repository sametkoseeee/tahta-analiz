export type Sheet = { name: string; rows: (string | number | null)[][] };

/** Tarayıcıda .xlsx oluşturup indirir. exceljs yalnızca tıklanınca yüklenir. */
export async function downloadXlsx(filename: string, sheets: Sheet[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tahta Analiz";

  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name.slice(0, 31));
    s.rows.forEach((r) => ws.addRow(r));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
    ws.columns.forEach((col, i) => {
      col.width = i === 0 ? 34 : 16;
      if (i > 0) col.numFmt = "#,##0.00";
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
