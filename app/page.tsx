"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Meeting = {
  id: number;
  platform: string;
  native_meeting_id: string | null;
  status: "scheduled" | "completed" | "failed" | string;
  start_time: string | null;
  end_time: string | null;
  completion_reason: string | null;

  data: {
    title?: string;
    scheduled_at?: string;
    segments_captured?: number;
    calendar_name?: string;
    calendar_managed?: boolean;
    auto_join?: boolean;
    stop_requested?: boolean;
    failure_reason?: string;
  };
};

function getMeetingDate(meeting: Meeting) {
  return (
    meeting.data.scheduled_at ||
    meeting.start_time ||
    meeting.end_time ||
    null
  );
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(date));
}

function getStatus(meeting: Meeting) {
  const segments = meeting.data.segments_captured ?? 0;

  const meetingDate = getMeetingDate(meeting);

  const isFuture =
    meetingDate &&
    new Date(meetingDate).getTime() > Date.now();

  if (isFuture) {
    return {
      label: "À venir",
      className: "bg-blue-100 text-blue-800",
    };
  }

  if (
    meeting.status === "completed" &&
    segments > 0
  ) {
    return {
      label: "Transcrite",
      className: "bg-green-100 text-green-800",
    };
  }

  if (meeting.status === "awaiting_admission") {
    return {
      label: "Bot en attente",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  if (meeting.status === "failed") {
    return {
      label: "Échec",
      className: "bg-red-100 text-red-800",
    };
  }

  if (meeting.status === "completed") {
    return {
      label: "Terminée",
      className: "bg-gray-100 text-gray-700",
    };
  }

  return {
    label: meeting.status,
    className: "bg-gray-100 text-gray-700",
  };
}

export default function Home() {
  const router = useRouter();
  const userName =
    process.env.NEXT_PUBLIC_NEYLIA_USER_NAME || "";
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [botLoading, setBotLoading] =
    useState<number | null>(null);

  async function loadMeetings() {
    try {
      setError("");

      const response = await fetch("/api/meetings", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur Vexa"
        );
      }

      setMeetings(data.meetings ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetings();
  }, []);

  async function cancelBot(meeting: Meeting) {
    if (!meeting.native_meeting_id) {
      return;
    }

    const confirmed = window.confirm(
      `Annuler le bot Neylia pour "${
        meeting.data.title || "cette réunion"
      }" ?`
    );

    if (!confirmed) {
      return;
    }

    setBotLoading(meeting.id);

    try {
      const response = await fetch(
        `/api/bot/${meeting.platform}/${encodeURIComponent(
          meeting.native_meeting_id
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible d'annuler le bot"
        );
      }

      await loadMeetings();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler le bot"
      );
    } finally {
      setBotLoading(null);
    }
  }

  function openMeeting(meeting: Meeting) {
    if (!meeting.native_meeting_id) {
      return;
    }

    router.push(
      `/meeting/${meeting.platform}/${
        meeting.native_meeting_id
      }?title=${encodeURIComponent(
        meeting.data.title || "Réunion"
      )}`
    );
  }

  /*
   * Séparation des réunions :
   *
   * - toutes les réunions futures fournies par Vexa
   * - réunions passées des 30 derniers jours
   */

  const now = new Date();

  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  );

  const upcomingMeetings = meetings
    .filter((meeting) => {
      const date = getMeetingDate(meeting);

      if (!date) {
        return false;
      }

      return new Date(date) >= now;
    })
    .sort((a, b) => {
      const dateA = new Date(
        getMeetingDate(a) || 0
      ).getTime();

      const dateB = new Date(
        getMeetingDate(b) || 0
      ).getTime();

      return dateA - dateB;
    });

  const pastMeetings = meetings
    .filter((meeting) => {
      const date = getMeetingDate(meeting);

      if (!date) {
        return false;
      }

      const meetingDate = new Date(date);

      return (
        meetingDate < now &&
        meetingDate >= thirtyDaysAgo
      );
    })
    .sort((a, b) => {
      const dateA = new Date(
        getMeetingDate(a) || 0
      ).getTime();

      const dateB = new Date(
        getMeetingDate(b) || 0
      ).getTime();

      return dateB - dateA;
    });

  function MeetingTable({
    meetings,
  }: {
    meetings: Meeting[];
  }) {
    if (meetings.length === 0) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400">
          Aucune réunion.
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b bg-gray-50 text-sm text-gray-500">
              <tr>
                <th className="px-5 py-4 font-medium">
                  Réunion
                </th>

                <th className="px-5 py-4 font-medium">
                  Date
                </th>

                <th className="px-5 py-4 font-medium">
                  État
                </th>

                <th className="px-5 py-4 font-medium">
                  Transcription
                </th>

                <th className="px-5 py-4 font-medium">
                  Bot
                </th>

                <th className="px-5 py-4 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {meetings.map((meeting) => {
                const status = getStatus(meeting);

                const segments =
                  meeting.data.segments_captured ?? 0;

                const canGenerate =
                  meeting.status === "completed" &&
                  segments > 0;

                const botCancelled =
                  meeting.data.stop_requested === true ||
                  meeting.data.failure_reason ===
                    "cancelled by the user before the bot was dispatched";

                const futureTeamsMeeting =
                  meeting.status === "scheduled" &&
                  meeting.platform === "teams" &&
                  !!meeting.native_meeting_id;

                const noTeamsLink =
                  meeting.status === "scheduled" &&
                  (meeting.platform === "unknown" ||
                    !meeting.native_meeting_id);

                return (
                  <tr
                    key={meeting.id}
                    className="hover:bg-gray-50"
                  >

                    {/* Réunion */}

                    <td className="px-5 py-4">

                      {canGenerate ? (
                        <button
                          onClick={() =>
                            openMeeting(meeting)
                          }
                          className="text-left font-medium text-gray-900 hover:text-blue-600"
                        >
                          {meeting.data.title ||
                            "Réunion sans titre"}
                        </button>
                      ) : (
                        <div className="font-medium text-gray-900">
                          {meeting.data.title ||
                            "Réunion sans titre"}
                        </div>
                      )}

                      <div className="mt-1 text-xs text-gray-400">
                        {meeting.platform === "teams"
                          ? "Microsoft Teams"
                          : meeting.platform === "unknown"
                          ? "Calendrier"
                          : meeting.platform}
                      </div>

                    </td>

                    {/* Date */}

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(
                        getMeetingDate(meeting)
                      )}
                    </td>

                    {/* État */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Transcription */}

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {segments > 0
                        ? `${segments} segments`
                        : "—"}
                    </td>

                    {/* Bot */}

                    <td className="px-5 py-4">

                      {botCancelled ? (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          Bot annulé
                        </span>
                      ) : futureTeamsMeeting ? (
                        <div className="flex items-center gap-3">

                          <span className="inline-flex whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            Bot prévu
                          </span>

                          <button
                            onClick={() =>
                              cancelBot(meeting)
                            }
                            disabled={
                              botLoading === meeting.id
                            }
                            className="whitespace-nowrap text-xs font-medium text-gray-500 hover:text-red-600 disabled:opacity-40"
                          >
                            {botLoading === meeting.id
                              ? "Annulation..."
                              : "Annuler"}
                          </button>

                        </div>
                      ) : meeting.status ===
                        "awaiting_admission" ? (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                          En attente
                        </span>
                      ) : noTeamsLink ? (
                        <span className="whitespace-nowrap text-xs text-gray-400">
                          Pas de Teams
                        </span>
                      ) : (
                        <span className="text-gray-300">
                          —
                        </span>
                      )}

                    </td>

                    {/* Action */}

                    <td className="px-5 py-4 text-right">

                      {canGenerate ? (
                        <button
                          className="whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                          onClick={() =>
                            openMeeting(meeting)
                          }
                        >
                          Générer le CR
                        </button>
                      ) : (
                        <span className="text-sm text-gray-300">
                          —
                        </span>
                      )}

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* En-tête */}

        <div className="mb-10 flex items-end justify-between">

          <div>
            <div className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Neylia
            </div>

	    <h1 className="mt-2 text-3xl font-bold text-gray-900">
	      {userName
	        ? `Réunions de ${userName}`
	        : "Mes réunions"}
	    </h1>

            <p className="mt-2 text-gray-500">
              Réunions Teams synchronisées depuis votre calendrier
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              loadMeetings();
            }}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading
              ? "Actualisation..."
              : "Actualiser"}
          </button>

        </div>

        {/* Chargement */}

        {loading && meetings.length === 0 && (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            Chargement des réunions...
          </div>
        )}

        {/* Erreur */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>

            {/* Réunions à venir */}

            <section className="mb-12">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    À venir
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    {upcomingMeetings.length} réunion
                    {upcomingMeetings.length > 1
                      ? "s"
                      : ""}
                  </p>
                </div>

              </div>

              <MeetingTable
                meetings={upcomingMeetings}
              />

            </section>

            {/* Réunions passées */}

            <section>

              <div className="mb-4">

                <h2 className="text-lg font-semibold text-gray-900">
                  Réunions passées
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  30 derniers jours ·{" "}
                  {pastMeetings.length} réunion
                  {pastMeetings.length > 1
                    ? "s"
                    : ""}
                </p>

              </div>

              <MeetingTable
                meetings={pastMeetings}
              />

            </section>

          </>
        )}

      </div>

    </main>
  );
}
