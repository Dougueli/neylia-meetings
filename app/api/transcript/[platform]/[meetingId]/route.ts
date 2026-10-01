import { NextResponse } from "next/server";

const VEXA_API = "https://api.cloud.vexa.ai";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string; meetingId: string }> }
) {
  const apiKey = process.env.VEXA_TRANSCRIPTION_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "VEXA_TRANSCRIPTION_KEY absente" },
      { status: 500 }
    );
  }

  const { platform, meetingId } = await params;

  try {
    const response = await fetch(
      `${VEXA_API}/transcripts/${encodeURIComponent(platform)}/${encodeURIComponent(meetingId)}`,
      {
        headers: {
          "X-API-Key": apiKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.text();

      return NextResponse.json(
        { error: `Vexa ${response.status}: ${error}` },
        { status: response.status }
      );
    }

    const transcript = await response.json();

    return NextResponse.json(transcript);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Impossible de récupérer la transcription" },
      { status: 500 }
    );
  }
}

