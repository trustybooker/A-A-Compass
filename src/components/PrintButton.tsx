"use client";

export function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 print:hidden"
    >
      🖨 {label}
    </button>
  );
}
