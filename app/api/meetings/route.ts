import { NextResponse } from "next/server";

const VEXA_API = "https://api.cloud.vexa.ai";

export async function GET() {
  const apiKey = process.env.VEXA_TRANSCRIPTION_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "VEXA_TRANSCRIPTION_KEY absente" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${VEXA_API}/meetings`, {
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();

      return NextResponse.json(
        { error: `Vexa ${response.status}: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const meetings = (data.meetings ?? [])
      .filter(
        (meeting: any) =>
          meeting.data?.calendar_managed === true
      )
      .sort((a: any, b: any) => {
        const dateA =
          a.data?.scheduled_at ??
          a.start_time ??
          a.created_at;

        const dateB =
          b.data?.scheduled_at ??
          b.start_time ??
          b.created_at;

        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Impossible de contacter Vexa" },
      { status: 500 }
    );
  }
}
