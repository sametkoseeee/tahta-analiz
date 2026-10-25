import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { CompanyDetail, FundDetail, FundSummary, IndexFile } from "./types";

const DATA = path.join(process.cwd(), "data");

export function getIndex(): IndexFile {
  const raw = fs.readFileSync(path.join(DATA, "companies.json"), "utf-8");
  return JSON.parse(raw) as IndexFile;
}

/** TEFAS fonları; script hiç çalışmadıysa boş liste */
export function getFunds(): { updatedAt: string | null; funds: FundSummary[] } {
  const file = path.join(DATA, "funds.json");
  if (!fs.existsSync(file)) return { updatedAt: null, funds: [] };
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function getFund(code: string): FundDetail | null {
  const file = path.join(DATA, "funds", `${code.toUpperCase()}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as FundDetail;
}

export function getCompany(code: string): CompanyDetail | null {
  const file = path.join(DATA, "companies", `${code.toUpperCase()}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as CompanyDetail;
}
