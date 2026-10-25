import type { Metadata } from "next";
import Account from "@/components/Account";

export const metadata: Metadata = { title: "Hesabım" };

export default function AccountPage() {
  return <Account />;
}
