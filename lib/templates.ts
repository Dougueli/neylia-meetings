export const reportTemplates: Record<string, string> = {
  commercial: `
Structure le compte rendu ainsi :

## Objet de l'échange
Résume en une ou deux phrases l'objectif de la réunion.

## Contexte / Besoin
Décris le contexte client et les besoins exprimés.

## Points abordés
Liste les sujets importants abordés pendant l'échange.

## Opportunités identifiées
Liste uniquement les opportunités commerciales réellement évoquées.

## Décisions / Engagements
Liste les décisions prises et les engagements explicites.

## Actions à mener
Pour chaque action identifiée, précise si possible :
- l'action
- le responsable
- l'échéance

## Prochaines étapes
Indique les prochaines étapes convenues.
`,

  recrutement: `
Structure le compte rendu ainsi :

## Synthèse du profil
Résume le profil et le parcours du candidat.

## Expériences et compétences
Présente les expériences, compétences techniques et fonctionnelles évoquées.

## Motivations
Résume les motivations et attentes exprimées.

## Disponibilité
Indique la disponibilité uniquement si elle est évoquée.

## Points à approfondir
Liste les éléments nécessitant une vérification ou un complément.

## Actions / Suite du processus
Liste les prochaines actions de recrutement évoquées.
`,

  technique: `
Structure le compte rendu ainsi :

## Objet / Contexte
Résume le contexte du projet ou du sujet technique.

## Sujets abordés
Présente les principaux sujets techniques discutés.

## Problèmes / Points de blocage
Liste les difficultés ou risques identifiés.

## Décisions techniques
Liste les décisions réellement prises.

## Actions
Pour chaque action, indique si possible :
- l'action
- le responsable
- l'échéance

## Prochaines étapes
Résume les prochaines étapes du projet.
`,

  interne: `
Structure le compte rendu ainsi :

## Objet de la réunion
Résume l'objectif de la réunion.

## Points abordés
Liste les principaux sujets discutés.

## Décisions
Liste les décisions prises.

## Actions
Pour chaque action, indique si possible :
- l'action
- le responsable
- l'échéance

## Points de vigilance
Liste les risques ou sujets nécessitant un suivi.

## Prochaines étapes
Résume les suites convenues.
`,

  generique: `
Structure le compte rendu ainsi :

## Synthèse
Résume la réunion de manière concise.

## Points clés
Liste les informations importantes.

## Décisions
Liste les décisions prises.

## Actions
Liste les actions identifiées avec responsable et échéance si disponibles.

## Prochaines étapes
Résume les suites convenues.
`,
};
