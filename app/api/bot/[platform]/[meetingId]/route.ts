import { NextResponse } from "next/server";

const VEXA_API = "https://api.cloud.vexa.ai";

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      platform: string;
      meetingId: string;
    }>;
  }
) {
  const apiKey = process.env.VEXA_BOT_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "VEXA_BOT_KEY absente" },
      { status: 500 }
    );
  }

  const { platform, meetingId } = await params;

  try {
    const response = await fetch(
      `${VEXA_API}/bots/${encodeURIComponent(platform)}/${encodeURIComponent(meetingId)}`,
      {
        method: "DELETE",
        headers: {
          "X-API-Key": apiKey,
        },
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.detail ||
            data?.message ||
            `Erreur Vexa ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Impossible de contacter Vexa",
      },
      { status: 500 }
    );
  }
}
