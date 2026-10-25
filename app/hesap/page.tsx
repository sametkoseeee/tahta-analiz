import type { Metadata } from "next";
import Account from "@/components/Account";

export const metadata: Metadata = { title: "Hesabım | Borsa Analiz" };

export default function AccountPage() {
  return <Account />;
}
