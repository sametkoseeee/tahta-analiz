import Link from "next/link";

/** Son / yaklaşan bilançolar sekmeleri */
export default function ReportsTabs({ active }: { active: "recent" | "upcoming" }) {
  const tab = (key: "recent" | "upcoming", href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm ${
        active === key ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bilançolar</h1>
        <p className="mt-1 text-sm text-muted">
          KAP&apos;ta açıklanan son bilançoları ve açıklanacak bilançoların tarihlerini tek yerde takip et.
        </p>
      </div>
      <div className="flex gap-1">
        {tab("recent", "/bilancolar", "Son bilançolar")}
        {tab("upcoming", "/bilancolar/yaklasan", "Yaklaşan bilançolar")}
      </div>
    </div>
  );
}
