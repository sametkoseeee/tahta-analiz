import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { CompanyDetail, IndexFile } from "./types";

const DATA = path.join(process.cwd(), "data");

export function getIndex(): IndexFile {
  const raw = fs.readFileSync(path.join(DATA, "companies.json"), "utf-8");
  return JSON.parse(raw) as IndexFile;
}

export function getCompany(code: string): CompanyDetail | null {
  const file = path.join(DATA, "companies", `${code.toUpperCase()}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as CompanyDetail;
}
