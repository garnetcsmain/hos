// Advisory needs<->supply matching (HOS-2026-007). Deterministic and
// explainable, mirroring the reunification matcher's philosophy: it SUGGESTS
// which available offers could serve a need and says WHY. It never commits,
// claims, or fulfills anything — a human always decides (Board condition).

import type { Need, Offer } from "@/app/lib/domain/coordination";

export interface OfferMatch {
  offer: Offer;
  /** Advisory 0..100 sort aid — a triage hint, not a guarantee. */
  score: number;
  reasons: string[];
}

function scoreOffer(need: Need, offer: Offer): OfferMatch | null {
  // Category must match for an offer to be useful for this need at all.
  if (offer.category !== need.category) return null;

  let score = 60;
  const reasons: string[] = [`Categoría coincide (${need.category})`];

  if (offer.district && need.district && offer.district === need.district) {
    score += 30;
    reasons.push(`Mismo distrito (${need.district})`);
  } else {
    reasons.push("Distrito distinto — puede requerir transporte");
  }

  if (offer.quantity >= need.quantity) {
    score += 10;
    reasons.push(`Cantidad suficiente (${offer.quantity} ${offer.unit})`);
  } else {
    reasons.push(`Cubre parcialmente (${offer.quantity}/${need.quantity} ${need.unit})`);
  }

  return { offer, score: Math.min(100, score), reasons };
}

/** Rank AVAILABLE offers for a need, best first. Only same-category offers are
 *  returned; district and quantity refine the advisory score. */
export function rankOffersForNeed(need: Need, offers: Offer[]): OfferMatch[] {
  return offers
    .filter((offer) => offer.status === "available")
    .map((offer) => scoreOffer(need, offer))
    .filter((match): match is OfferMatch => match !== null)
    .sort((a, b) => b.score - a.score);
}
