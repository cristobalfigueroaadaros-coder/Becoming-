import type { EventType, TimePeriod } from "@/hooks/useLifetimeEvents";

export type LifetimeCandidateSeed = {
  candidate_key: string;
  event_label: string;
  event_description: string;
  suggested_time_period: TimePeriod;
  suggested_event_type: EventType;
  source_evidence: string[];
  sort_order: number;
};

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

export const extractLifetimeCandidates = (evidenceText: string): LifetimeCandidateSeed[] => {
  const normalized = evidenceText.toLowerCase();
  const candidates: LifetimeCandidateSeed[] = [];

  const add = (candidate: LifetimeCandidateSeed) => {
    if (!candidates.some((item) => item.candidate_key === candidate.candidate_key)) {
      candidates.push(candidate);
    }
  };

  if (includesAny(normalized, ["chile", "santiago"]) && includesAny(normalized, ["berlin", "germany"])) {
    add({
      candidate_key: "left-chile-for-berlin",
      event_label: "Leaving Chile for Berlin",
      event_description: "Moving from Chile into a completely different culture challenged your identity and became a formative chapter in who you were becoming.",
      suggested_time_period: "mid_20s",
      suggested_event_type: "change",
      source_evidence: ["Chile", "Berlin", "Germany", "different culture"],
      sort_order: 10,
    });
  }

  if (includesAny(normalized, ["berlin", "germany"]) && includesAny(normalized, ["australia", "melbourne"])) {
    add({
      candidate_key: "berlin-to-australia",
      event_label: "Starting again in Australia",
      event_description: "After Germany, you moved to Australia and spent years testing new directions through entrepreneur programs, projects, and experiments.",
      suggested_time_period: "late_20s",
      suggested_event_type: "change",
      source_evidence: ["Berlin", "Australia", "Melbourne", "entrepreneur programs"],
      sort_order: 20,
    });
  }

  if (includesAny(normalized, ["e-commerce", "ecommerce"]) && includesAny(normalized, ["chile", "selling", "shoes"])) {
    add({
      candidate_key: "first-ecommerce-in-chile",
      event_label: "Starting my first business in Chile",
      event_description: "Your first e-commerce business gave you an early experience of turning an idea into a real offer and learning from the market.",
      suggested_time_period: "early_20s",
      suggested_event_type: "work",
      source_evidence: ["first business", "e-commerce", "Chile"],
      sort_order: 30,
    });
  }

  if (includesAny(normalized, ["bali", "cultural festival", "festival"]) && includesAny(normalized, ["dancing", "painting", "fire", "ceremon", "experience"])) {
    add({
      candidate_key: "bali-cultural-festival",
      event_label: "Creating the Bali cultural festival",
      event_description: "You created a festival where music, painting, fire, play, and shared atmosphere helped people connect and feel part of something.",
      suggested_time_period: "current",
      suggested_event_type: "work",
      source_evidence: ["Bali", "cultural festival", "music", "painting", "dancing"],
      sort_order: 40,
    });
  }

  if (normalized.includes("family squad")) {
    add({
      candidate_key: "created-family-squad",
      event_label: "Creating Family Squad",
      event_description: "You developed Family Squad to help parents and children reconnect, develop emotional intelligence, and spend meaningful time together.",
      suggested_time_period: "current",
      suggested_event_type: "work",
      source_evidence: ["Family Squad", "board game", "families", "emotional intelligence"],
      sort_order: 50,
    });
  }

  if (includesAny(normalized, ["broke my leg", "broken my leg", "leg in", "surgery", "couldn't walk", "could not walk"]) && normalized.includes("covid")) {
    add({
      candidate_key: "recovery-during-covid",
      event_label: "Finishing Family Squad during recovery",
      event_description: "Breaking your leg during COVID left you isolated and unable to work or walk, but the recovery period became the time when you finished and tested Family Squad.",
      suggested_time_period: "current",
      suggested_event_type: "health",
      source_evidence: ["broken leg", "COVID", "surgery", "finished the game"],
      sort_order: 60,
    });
  }

  if (normalized.includes("grandfather") && includesAny(normalized, ["social housing", "architect", "helped a lot of people", "gave them hope"])) {
    add({
      candidate_key: "grandfather-model-of-service",
      event_label: "Learning service through my grandfather",
      event_description: "Your grandfather showed you that a person's vocation can give people dignity, hope, and a better place to live.",
      suggested_time_period: "childhood",
      suggested_event_type: "family",
      source_evidence: ["grandfather", "architect", "social housing", "helped people"],
      sort_order: 70,
    });
  }

  return candidates.sort((a, b) => a.sort_order - b.sort_order);
};
