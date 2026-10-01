"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Segment = {
  start: number;
  end: number;
  text: string;
  language: string;
  speaker: string;
  completed: boolean;
  segment_id: string;
  absolute_start_time: string;
  absolute_end_time: string;
};

type Transcript = {
  id: number;
  platform: string;
  native_meeting_id: string;
  status: string;
  start_time: string;
  end_time: string;
  segments: Segment[];
};

const reportTypes = [
  { value: "auto", label: "Automatique" },
  { value: "commercial", label: "Commercial / Client" },
  { value: "recrutement", label: "Recrutement / Candidat" },
  { value: "technique", label: "Technique / Projet" },
  { value: "interne", label: "Interne / Management" },
  { value: "generique", label: "Générique" },
];

function formatTime(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(date));
}

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const platform = params.platform as string;
  const meetingId = params.meetingId as string;
  const title = searchParams.get("title") || "Réunion";

  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [reportType, setReportType] = useState("auto");
  const [detectedType, setDetectedType] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTranscript() {
      try {
        const response = await fetch(
          `/api/transcript/${encodeURIComponent(platform)}/${encodeURIComponent(meetingId)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur Vexa");
        }

        setTranscript(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger la transcription"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTranscript();
  }, [platform, meetingId]);

  async function generateSummary() {
    if (!transcript) return;

    setGenerating(true);
    setGenerationError("");
    setCopied(false);

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          reportType,
          transcript: transcript.segments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Impossible de générer le compte rendu"
        );
      }

      setSummary(data.summary);
      setDetectedType(
        reportType === "auto" ? data.reportType : ""
      );
    } catch (err) {
      setGenerationError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la génération"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function copySummary() {
    if (!summary) return;

    await navigator.clipboard.writeText(summary);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function getReportTypeLabel(type: string) {
    const found = reportTypes.find(
      (item) => item.value === type
    );

    return found?.label || type;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Mes réunions
        </button>

        <div className="mb-8">
          <div className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Neylia
          </div>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {title}
          </h1>

          {transcript && (
            <p className="mt-2 text-gray-500">
              {transcript.segments.length} segments transcrits
            </p>
          )}
        </div>

        {loading && (
          <div className="rounded-xl border bg-white p-8 text-gray-500">
            Chargement de la transcription...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {transcript && (
          <>
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Type de compte rendu
                  </label>

                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900"
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateSummary}
                  disabled={generating}
                  className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating
                    ? "Génération en cours..."
                    : summary
                    ? "Regénérer le CR"
                    : "Générer le CR"}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                En mode automatique, Neylia détermine le type de réunion
                à partir de son contenu.
              </p>

              {generationError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {generationError}
                </div>
              )}
            </div>

            <div
              className={`grid gap-6 ${
                summary
                  ? "lg:grid-cols-2"
                  : "grid-cols-1"
              }`}
            >

              {summary && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Compte rendu
                      </h2>
                      <p className="mt-1 text-xs text-gray-400">
                        Vous pouvez modifier le texte avant de le copier.
                      </p>
                    </div>

                    <button
                      onClick={copySummary}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {copied ? "Copié ✓" : "Copier"}
                    </button>
                  </div>

                  <div className="p-6">
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="min-h-[65vh] w-full resize-none rounded-lg border border-gray-200 bg-white p-4 font-sans text-sm leading-7 text-gray-800 outline-none focus:border-gray-400"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="font-semibold text-gray-900">
                    Transcription
                  </h2>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-6">
                  <div className="space-y-5">
                    {transcript.segments.map((segment) => (
                      <div key={segment.segment_id}>
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-gray-900">
                            {segment.speaker || "Intervenant"}
                          </span>

                          <span className="text-xs text-gray-400">
                            {formatTime(segment.absolute_start_time)}
                          </span>
                        </div>

                        <p className="mt-1 leading-6 text-gray-700">
                          {segment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </main>
  );
}
