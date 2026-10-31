# Roadmap

## Done
- [x] Neon connected, migrations to 0134 applied
- [x] Two-tier identity + workspace-scoped console
- [x] Round 1: "Niet opgeslagen" root cause + help window + Brevo error reports
- [x] Round 2: short-link trust rule + new "Je verlaat ROUT" screen
- [x] Round 3: SSRF (calendar fetches), Stripe replay window, workspace permission tests
- [x] Round 4: YouTube theme, 15-min TTL, push updates, LIVE badge, /live link
- [x] Round 5: Studio cleanup (avatar shape in Vormgeving + squircle, presets icon, share icon)
- [x] Round 6: Feedback & reviews (0134 applied, tests green)
- [x] Round 7: Events engine (0135 applied, Studio panel, /event/:slug with QR + .ics)
- [x] Round 8: Steam card + CSS effects (STEAM_WEB_API_KEY still to set)
- [x] Re-import 1:1 from compass-navigator-500baf53, Neon linked in this project
- [x] Task A: migration 0136 (per-app email choice) applied on Neon
- [x] Migration 0125: legacy password column dropped on Neon
- [x] OIDC email broker (RFC-004): per-app email routing + pairwise app IDs

- [x] Round 9 B: private e-mail relay (priv-…@mail.rout.be → verified email), 0137 applied, Brevo inbound webhook, tests
- [x] Round 9 C: Apple Wallet (.pkpass) + Google Wallet for profiles and events, "Add to Wallet" in share menu + event page, fallback without certificates
- [x] Round 9 D: 1077 tests green, typecheck clean

- [x] Round 10: wallet accepts APPLE_PASS_* / GOOGLE_WALLET_SERVICE_ACCOUNT, demo payload without certificates (pass-generator.server.ts)
- [x] Round 10: short link /e/:slug → /event/:slug (301)
- [x] Round 10: profile agenda card fed by published profile_events (details, .ics, Google)
- [x] Round 10: Steam QR type (official mark, steamcommunity.com/id|profiles validation, Steam look)
- [x] Round 10: missing keys audited (Steam card hidden, social login 400 provider_not_configured, wallet demo, Brevo never throws); 1086 tests green, typecheck clean

## Open
- [ ] Finish continuation: authoritative app scope checks, verified/session-bound/single-use step-up, merge safety and existing Wallet/Last.fm validation; report external blockers separately
- [x] License directive: official LICENSE, AGPL-3.0-or-later package/README, exact 2026 footer and About/Sovereignty/Manifesto consistency (desktop/mobile checked)
- [x] Current project: connect existing Neon and audit imported identity, email, footer, Wallet and Last.fm implementations
- [x] Apply existing 0139 on Neon and regenerate replay-based schema snapshot/types; typecheck clean, 1110 tests green
- [x] Harden per-app email privacy, sensitive disclosure audit writes and webhook DNS host validation; add UserInfo and transactional bulk regression tests
- [ ] Identity merge/biometric step-up, uniform pairwise rollout and scope enforcement: not completed; existing client binding compatibility and verified WebAuthn proof require a dedicated security implementation
- [ ] Live schema differences: 9 grants and audit sequence differ from migration replay; historical 91_shadowban checksum differs. Needs reviewed delta, never rewrite history
- [ ] Hosting/privacy guarantees and repository metadata alignment: needs production infrastructure/vendor evidence and repository write access; license text is aligned
- [ ] Verify authenticated email/consent/bulk-update flow with real accounts (blocked by existing live secrets)
- [x] Relay address as a choice on the "Login met ROUT" consent screen (0138 applied)
- [ ] Expansion rounds C–G (encounters, ZK badges/VIES/employee credentials, human-only drops + E2E forms, brand kits + SEPA, human_verified claim + rout.config.json) — each needs its own plan

## Waiting on user
- [ ] Secrets in this project: BETTER_AUTH_SECRET, ROUT_PROVIDER_*, Google/Apple sign-in, BREVO_API_KEY, Stripe/Wise, storage, STEAM_WEB_API_KEY, Apple/Google Wallet certificates, EMAIL_INBOUND_TOKEN
- [ ] Live sign-in test (needs secrets)
