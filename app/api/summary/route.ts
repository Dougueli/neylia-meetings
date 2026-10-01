import { NextResponse } from "next/server";
import { reportTemplates } from "@/lib/templates";

const MISTRAL_API = "https://api.mistral.ai/v1/chat/completions";

const typeDescriptions = `
- commercial : rendez-vous client, prospect, besoin commercial, mission,
  prestation, opportunité, proposition ou suivi client.
- recrutement : entretien candidat, recrutement, parcours professionnel,
  compétences, motivations ou disponibilité d'un candidat.
- technique : réunion projet, développement, infrastructure, architecture,
  incident, bug, DevOps, cloud ou discussion principalement technique.
- interne : réunion interne, management, organisation, RH, pilotage
  d'équipe ou réunion de fonctionnement.
- generique : réunion ne correspondant clairement à aucune des catégories
  précédentes.
`;

export async function POST(request: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "MISTRAL_API_KEY absente" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { title, reportType, transcript } = body;

    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "Transcription absente" },
        { status: 400 }
      );
    }

    const transcriptText = transcript
      .filter(
        (segment: any) =>
          segment.text &&
          segment.text.trim().length > 0
      )
      .map((segment: any) => {
        const speaker =
          segment.speaker || "Intervenant";

        return `${speaker} : ${segment.text.trim()}`;
      })
      .join("\n");

    let selectedType = reportType;
    let automatic = false;

    if (
      !selectedType ||
      selectedType === "auto" ||
      !reportTemplates[selectedType]
    ) {
      automatic = true;
      selectedType = "auto";
    }

    const systemPrompt = `
Tu es Neylia, un assistant professionnel spécialisé dans
la production de comptes rendus de réunions d'entreprise.

Tu dois produire un compte rendu clair, concis et directement exploitable.

RÈGLES IMPÉRATIVES :

- Écris en français.
- Base-toi uniquement sur la transcription fournie.
- N'invente aucune information.
- N'invente jamais de décision, action, responsable ou échéance.
- Ignore les hésitations, répétitions, tests micro et conversations
  sans intérêt pour le compte rendu.
- Corrige les erreurs évidentes de transcription uniquement lorsque
  le contexte permet de le faire avec certitude.
- Conserve les noms propres lorsqu'ils sont identifiables.
- Synthétise par sujet et non chronologiquement.
- Fais ressortir les informations importantes.
- Utilise un style professionnel, direct et concis.
- Ne mentionne jamais l'IA, Mistral ou la transcription.
- N'ajoute aucun commentaire avant ou après le compte rendu.
`;

    let userPrompt: string;

    if (automatic) {
      userPrompt = `
TITRE DE LA RÉUNION :
${title || "Non précisé"}

Tu dois d'abord déterminer le type principal de cette réunion.

Les catégories possibles sont :

${typeDescriptions}

Choisis la catégorie qui représente le mieux l'objectif principal
de la réunion, en tenant compte du titre ET surtout du contenu.

Puis produis directement le compte rendu avec la structure
correspondante ci-dessous.

=== COMMERCIAL ===
${reportTemplates.commercial}

=== RECRUTEMENT ===
${reportTemplates.recrutement}

=== TECHNIQUE ===
${reportTemplates.technique}

=== INTERNE ===
${reportTemplates.interne}

=== GENERIQUE ===
${reportTemplates.generique}

TRANSCRIPTION :
----------------
${transcriptText}
----------------

IMPORTANT :
Ta réponse doit commencer exactement par une ligne au format :

TYPE: commercial

ou

TYPE: recrutement

ou

TYPE: technique

ou

TYPE: interne

ou

TYPE: generique

Puis laisse une ligne vide et rédige le compte rendu.
`;
    } else {
      const template = reportTemplates[selectedType];

      userPrompt = `
TITRE DE LA RÉUNION :
${title || "Non précisé"}

TYPE DE COMPTE RENDU :
${selectedType}

FORMAT ATTENDU :
${template}

TRANSCRIPTION :
----------------
${transcriptText}
----------------

Produis maintenant le compte rendu.
`;
    }

    const response = await fetch(MISTRAL_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mistral error:", data);

      return NextResponse.json(
        {
          error:
            data?.message ||
            "Erreur lors de l'appel à Mistral",
        },
        { status: response.status }
      );
    }

    let summary =
      data?.choices?.[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: "Mistral n'a retourné aucun contenu" },
        { status: 500 }
      );
    }

    if (automatic) {
      const match = summary.match(
        /^\s*TYPE:\s*(commercial|recrutement|technique|interne|generique)\s*/i
      );

      if (match) {
        selectedType = match[1].toLowerCase();

        summary = summary
          .replace(
            /^\s*TYPE:\s*(commercial|recrutement|technique|interne|generique)\s*/i,
            ""
          )
          .trim();
      } else {
        selectedType = "generique";
      }
    }

    return NextResponse.json({
      summary,
      reportType: selectedType,
      automatic,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Impossible de générer le compte rendu" },
      { status: 500 }
    );
  }
}
