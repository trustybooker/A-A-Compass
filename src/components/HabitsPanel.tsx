"use client";

import { useCallback, useEffect, useState } from "react";

interface HabitLog {
  id: string;
  logDate: string;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  cadence: string;
  logs: HabitLog[];
}

function currentStreak(logs: HabitLog[]): number {
  const days = new Set(logs.filter((l) => l.completed).map((l) => l.logDate.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  // A streak counts back from today (or yesterday, if today isn't logged yet).
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!days.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function HabitsPanel() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (res.ok) {
      const data = await res.json();
      setHabits(data.habits ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create habit.");
      }
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function logToday(habitId: string) {
    await fetch(`/api/habits/${habitId}/log`, { method: "POST" });
    await load();
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <form onSubmit={createHabit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "10 min alignment + 20 min action + 3 min gratitude"'
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          Add habit
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {habits.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
          No habits yet. Every Compass Reading suggests one habit loop — add it here and log it daily.
        </p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => {
            const doneToday = habit.logs.some(
              (l) => l.completed && l.logDate.slice(0, 10) === todayKey,
            );
            const streak = currentStreak(habit.logs);
            return (
              <li
                key={habit.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="font-medium text-stone-900">{habit.name}</div>
                  <div className="text-sm text-stone-500">
                    🔥 {streak}-day streak · {habit.cadence}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => logToday(habit.id)}
                  disabled={doneToday}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    doneToday
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {doneToday ? "Done today ✓" : "Log today"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
