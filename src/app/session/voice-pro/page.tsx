import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { hasFeature, BROWSER_VOICE_LABEL } from "@/lib/tiers";
import { UpgradeGate } from "@/components/UpgradeGate";
import { VoiceCoach } from "@/components/VoiceCoach";
import { VoiceSample } from "@/components/VoiceSample";

export const metadata = { title: "A&A Aligned Voice Coach" };
export const dynamic = "force-dynamic";

export default async function VoiceProPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "pro_voice")) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <UpgradeGate
          requiredTier="pro"
          featureName="The premium A&A Aligned Voice Coach"
          detail={`Realtime conversation, interruptions, smart follow-up questions, pattern memory, and weekly coach reports. ${BROWSER_VOICE_LABEL}`}
        />
        <VoiceSample />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-2xl shadow">
        <Image
          src="/images/living-room-reflection.webp"
          alt="A warm, quiet space for a voice coaching conversation"
          width={1600}
          height={640}
          className="h-40 w-full object-cover"
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-stone-900">A&amp;A Aligned Voice Coach</h1>
        <p className="mt-1 text-stone-600">
          A realtime guided session: the coach asks what you seek alignment around, listens,
          reflects truth, asks 2–5 smart follow-up questions, and ends with your vision, action,
          habit, gratitude, and service outcome. The session summary saves to your history.
        </p>
      </div>
      <VoiceCoach />
    </div>
  );
}
