import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DataControls } from "@/components/DataControls";

export const metadata = { title: "Your data" };
export const dynamic = "force-dynamic";

export default async function DataSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Your data</h1>
        <p className="mt-1 text-stone-600">
          Your reflections are yours. Export them anytime, or delete everything permanently.
        </p>
      </div>
      <DataControls />
    </div>
  );
}
