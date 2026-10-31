/** Selective-disclosure scopes for "Login met ROUT". Pure and browser-safe. */

export const IDENTITY_SCOPES = ["sybil:verify", "profile:read", "identity:legal_name", "identity:national_id"] as const;
export type IdentityScope = (typeof IDENTITY_SCOPES)[number];

/** Scopes the member can switch off on the consent screen (openid never). */
export const OPTIONAL_SCOPES: readonly string[] = ["sybil:verify", "profile:read", "identity:legal_name", "identity:national_id"];

/** Scopes whose disclosure is written to identity_disclosure_logs. */
export const SENSITIVE_SCOPES: readonly string[] = ["sybil:verify", "identity:legal_name", "identity:national_id"];

export type Tier = "none" | "tier_1" | "tier_2";

/** Removes the scopes the member switched off; `openid` always stays. */
export function applyConsentToggles(scopes: string[], declined: string[] = []): string[] {
  const off = new Set(declined.filter((s) => OPTIONAL_SCOPES.includes(s)));
  return scopes.filter((s) => s === "openid" || !off.has(s));
}

export type ScopeDecision = { ok: true } | { ok: false; status: 403; error: string };

/**
 * National registry number: only for a trusted KYC partner, a tier-2 member and a
 * token issued after a fresh step-up. Anything else is 403.
 */
export function nationalIdDecision(input: { trustedPartner: boolean; tier: Tier; stepUp: boolean }): ScopeDecision {
  if (!input.trustedPartner) return { ok: false, status: 403, error: "client_not_trusted_kyc_partner" };
  if (input.tier !== "tier_2") return { ok: false, status: 403, error: "tier_2_required" };
  if (!input.stepUp) return { ok: false, status: 403, error: "step_up_required" };
  return { ok: true };
}

/** Legal name requires tier 2; sybil proof requires tier 1 or 2. Missing tier = claim omitted. */
export function tierAllows(scope: string, tier: Tier): boolean {
  if (scope === "identity:legal_name" || scope === "identity:national_id") return tier === "tier_2";
  if (scope === "sybil:verify") return tier === "tier_1" || tier === "tier_2";
  return true;
}

/** The sensitive scopes that were actually disclosed in one response. */
export function disclosedSensitive(granted: string[], tier: Tier): string[] {
  return granted.filter((s) => SENSITIVE_SCOPES.includes(s) && tierAllows(s, tier));
}

/** Splits "Jona Zeno Delplanche" into first (all but last) and last name. */
export function splitLegalName(full: string | null): { first_name: string | null; last_name: string | null; full_legal_name: string | null } {
  const clean = (full ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return { first_name: null, last_name: null, full_legal_name: null };
  const parts = clean.split(" ");
  if (parts.length === 1) return { first_name: parts[0]!, last_name: null, full_legal_name: clean };
  return { first_name: parts.slice(0, -1).join(" "), last_name: parts[parts.length - 1]!, full_legal_name: clean };
}
