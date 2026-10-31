import type { Metadata } from "next";
import Account from "@/components/Account";

export const metadata: Metadata = {
  alternates: { canonical: "/hesap" }, title: "Hesabım" };

export default function AccountPage() {
  return <Account />;
}
