import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { CapitalAction, CompanyDetail, IndexFile } from "./types";

const DATA = path.join(process.cwd(), "data");

export function getIndex(): IndexFile {
  const raw = fs.readFileSync(path.join(DATA, "companies.json"), "utf-8");
  return JSON.parse(raw) as IndexFile;
}

/** Sermaye artırımları; script hiç çalışmadıysa boş liste */
let capitalCache: { updatedAt: string | null; rows: CapitalAction[] } | null = null;

export function getCapitalActions(): { updatedAt: string | null; rows: CapitalAction[] } {
  if (capitalCache) return capitalCache;
  const file = path.join(DATA, "sermaye_artirimlari.json");
  capitalCache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : { updatedAt: null, rows: [] };
  return capitalCache!;
}

export function getCompany(code: string): CompanyDetail | null {
  const file = path.join(DATA, "companies", `${code.toUpperCase()}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as CompanyDetail;
}
