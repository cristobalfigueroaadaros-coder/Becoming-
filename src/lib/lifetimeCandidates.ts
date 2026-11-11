export type GroundedLifetimeMoment = { label: string; sourceQuote: string };

export type LifetimeCandidateSeed = {
  candidate_key: string;
  event_label: string;
  event_description: string;
  source_evidence: string[];
  linked_atlas_dot_ids: string[];
  sort_order: number;
};

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

export const buildLifetimeCandidates = (
  moments: GroundedLifetimeMoment[],
  userAnswers: string[],
  savedDots: { savedDotId: string | null; sourceQuote?: string }[],
): LifetimeCandidateSeed[] => {
  const answers = userAnswers.map(normalize);
  const candidates = new Map<string, LifetimeCandidateSeed>();
  for (const { label, sourceQuote } of moments) {
    const quote = normalize(sourceQuote);
    const title = normalize(label);
    if (!title || quote.length < 12 || quote.length > 400 || !quote.includes(title)) continue;
    if (!answers.some((answer) => answer.includes(quote))) continue;

    const key = `grounded:${normalize(label).replace(/[.!?]+$/u, "")}`;
    if (candidates.has(key)) continue;
    const linkedDotIds = savedDots.flatMap(({ savedDotId, sourceQuote: dotQuote }) => {
      const evidence = normalize(dotQuote || "");
      return savedDotId && evidence.length >= 12 && (quote.includes(evidence) || evidence.includes(quote))
        ? [savedDotId]
        : [];
    });
    candidates.set(key, {
      candidate_key: key,
      event_label: label,
      event_description: sourceQuote,
      source_evidence: [sourceQuote],
      linked_atlas_dot_ids: [...new Set(linkedDotIds)],
      sort_order: candidates.size * 10,
    });
  }
  return [...candidates.values()];
};
