<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Profile preview URLs carry an explicit root/alias namespace via profile-preview.ts; og-profile.server.ts enforces public visibility before rendering. Why: same-named aliases must never show another profile's card.
- Uploaded avatar candidates use the image proxy, which allows only the configured storage bucket server-side; OG rasterization fetches first-party/proxied images only. Why: stored uploads must display without exposing visitor IPs or permitting arbitrary fetches.
- Profile PNG and SVG previews share an embedded proxied avatar and canvas-derived text colors; showcase labels use the surrounding page's semantic text tokens. Why: SVG image fallbacks cannot load nested remote photos and dark profile colors are unreadable on light gallery surfaces.
- Neon is the only database, reached only through src/lib/neon.ts, which picks the transport (direct via DATABASE_URL on Vercel, Lovable connector in preview); server code checks availability only via `hasDatabase()`, never one transport's env vars. Why: a connector-only check crashed every sign-in on Vercel.
- Login ON rout.be (Better Auth, `better-auth.server.ts`) and login VIA rout.be (OIDC provider, `src/lib/oauth/*`) never share config; provider env vars use the `ROUT_PROVIDER_*` prefix. Why: one role must not break the other.
- Sign-in tiles always render; missing credentials are refused before auth with provider_not_configured (400) and a warning. Why: missing keys must not hide options or crash auth.
- Public profile visibility (`publicProfile`, `timelineVisible` in `display_prefs`) is enforced server-side in the public profile/timeline functions. Why: client checks leak data.
- Every env var name is documented in `ENVIRONMENT.md` (+ `.env.example`); provider env lookups go through `envAny()` aliases in `better-auth.server.ts` (incl. `<PROVIDER>_OAUTH_CLIENT_*`); the auth secret resolves via `resolveAuthSecret()` with a derived fallback. Why: one findable list; a missing variable never breaks all sign-ins.
- A failed provider-status check on the sign-in screen means unknown (buttons still try), never "all inactive". Why: a flaky status call must not disable logins.
- Sign-ins return via `/auth/continue`; destinations/tour drafts use HttpOnly cookies; drafts only for new accounts, taken handles go to onboarding. Why: no token leaks or overwrites. Auth emails: `sendLocalizedEmail`, static template IDs, non-blocking.
- Builds: nitro `vercel` on Vercel, cloudflare in sandbox.
- Third-party images on public pages load only via `/api/public/proxy-image` (host allowlist in `src/lib/image-proxy-rules.ts`). Why: visitors' IPs must never reach third-party image hosts.
- db/ is the only schema source: numbered SQL files (new ones 4-digit from 0111, unique), ordered numerically by scripts/migration-plan.ts for both runners (migrate-gateway.ts splits statements, one batch per transaction). App code never runs DDL (no-runtime-ddl test). Why: text sorting ran 100+ before 10..99 and runtime DDL caused drift.
- 0000_baseline.sql is a squashed baseline covering <=110: run only on an empty database, otherwise recorded. After any migration run `bun scripts/schema-snapshot.ts` to refresh db/schema.snapshot.json + src/lib/db-types.gen.ts; CI replays all migrations on PGlite and must equal the snapshot, `--check` compares live. Why: the old files could not build an empty database.
- "Login met ROUT" signing keys live only sealed (key-seal.server.ts, KEK from ROUT_PROVIDER_SIGNING_KEK, HMAC-derived per-kid AES-256-GCM); rules in key-rules.ts: 90-day auto rotation, 48 h JWKS grace, ES256 + exact kid or reject. Legacy plaintext keys are sealed only via scripts/seal-signing-keys.ts after all deployments run this code. Why: a database reader must never be able to forge ID tokens, and older deployments can only read plaintext.
- Applied migrations are immutable; corrections use new delta files and checksum drift is reported, never silently repaired. Why: database history must remain reproducible.
- Profile booking navigation uses typed /$username/booking search context; selected UTC starts are accepted only when offered by current availability. Why: no hard reloads or trusting stale URL slots.
- Deployment mode comes only from `src/lib/app-mode.ts` (`VITE_APP_MODE`/`APP_MODE`): `appModeMiddleware` in `src/start.ts` 404s admin paths in public mode and confines admin mode to the portal (noindex), `assertAdminRole` refuses in public mode, and `api_.auth.$.ts` refuses social providers in admin mode. Why: the split must hold server-side, never only in the UI.
- Build mode filters route files via app-mode-routes.ts; admin files use admin.* names. Why: public bundles must exclude admin code.
- Shells load lazily; preview mode overrides are UI-only. Why: previews never loosen server access.

- Admin control uses authenticated RPCs with assertAdminRole, keyset pages and explicit errors; transport logs store actual HTTP status/direction, never URLs or request bodies. Why: protect private data and avoid invented telemetry.
- Admin email entry checks configured owners or stored admin roles before auth; endpoint checks remain. Why: refuse members without granting privileges.
- No Supabase client or token middleware; sessions use the rout_session cookie. Why: it broke sign-in.
- Client-supplied redirects/origins pass `safe-redirect.ts`; never log auth codes, tokens or message text. Why: no open redirects or leaks.

- Workspace roles are checked server-side only (`workspaces.server.ts`, HttpOnly `active_workspace_id` cookie, `requireDeveloperAccess` on console/API-key fns; invites need a verified email). Why: UI hiding never protects data.
- Subdirectories (e.g. src/lib) have their own AGENTS.md; read it before changing files there.

- Auth and Studio display text uses the existing area locale bundles merged by the i18n provider; identifiers, stored values and access rules never use translated strings. Why: language changes must not change application behavior.
- Plan caps and storage quotas come only from `entitlement-engine.ts` (pure) + `entitlement-engine.server.ts` (loads plan + `entitlement_overrides` per user/workspace scope); uploads get URLs only via `/api/upload/presign`; the early-verified promo is a DB trigger on `profiles.verified`. Why: one rule set, and every verification path grants the promo.
- Scope in the URL (`/studio/personal/<feature>`, `/studio/w/<slug>/<feature>`) is applied through `activateScopeFromUrl` (membership checked server-side); scope switches call `queryClient.clear()`. Why: no cached data crosses personal/workspace scopes.
- Custom live status lives in `custom-presence.ts` (pure rules) + `custom-presence.server.ts` (hashed `rp_` keys, 15s cache); visitors read only `/api/public/presence/$handle`, makers write via `POST /api/v1/presence`. Why: no visitor ever contacts a third-party platform and keys are never stored in plain text.
- Every upload path (presign and direct) calls `checkActiveScopeUpload` before storing. Why: 0 MB scopes must be blocked everywhere, not only on presign.
- Bookings are managed inside the Studio page switcher; `/studio/booking` only redirects. Why: one page model for profile, tip and booking.
- Profile sub-pages (`/$username/booking|tip|donate|$slug`, `/u/$username/...`) are un-nested route files (`$username_.*.tsx`) because the profile routes render no `<Outlet />`. Why: nested children silently rendered the profile instead of the sub-page.
- Uploads check the active-scope quota before any storage configuration check and surface `STORAGE_QUOTA_MESSAGE`. Why: a 0 MB workspace must always get the quota answer, never a different error.
- Public workspace pages live at /w/$slug via workspace-public.functions.ts and expose only name, avatar, verified domain and a public profile handle; slug validity comes only from isValidWorkspaceSlug in workspace-rules.ts. Why: one rule for server, UI and DB check.

- Brand protection comes only from `src/lib/reserved-brands.ts` (`isReservedName`, mirrored in db/0116 `reserved_brands`) and is applied inside `isReservedHandle` and `isValidWorkspaceSlug`; free workspaces get `matrixWorkspaceSlug(..., "free")` with a random 4-char suffix. Why: one rule for handles, aliases and slugs.
- Without a live database, refresh db/schema.snapshot.json + db-types via `bun scripts/schema-replay-snapshot.ts` (PGlite replay); confirm live with `schema-snapshot.ts --check`. Why: the snapshot must track every migration even offline.

- Free workspaces always carry a 4-char suffix, enforced by the db/0122 trigger; dropping it (clean slug or root alias in `workspace_root_aliases`, a namespace slot in `findHandleOwner`) needs `planAllowsCleanSlug` = paid plan or Early Verified owner, mirrored by `workspace_may_drop_suffix`. Why: the app layer can never be bypassed.
- Clean workspace slugs (suffix dropped) are claimed only via `claimCleanWorkspaceSlug`, decided by pure `checkCleanSlugClaim` (paid plan from the entitlement engine, `isValidWorkspaceSlug(slug, { brandReleased })`, uniqueness). Why: one rule decides plan, brand release and uniqueness.
- RLS policies are a single `rout_scope` policy per table (db/0120): owner columns = `rout_current_user_id()` from `rout.user_id`, workspace rows via `rout_is_workspace_member`; secret/server-only tables keep no policy. `public.users.auth_user_id` links to `neon_auth."user"` (cascade); `users.id` is not that FK because legacy ids differ. Why: deny by default without breaking legacy accounts.
- Studio storage display reads `getActiveScopeStorage` (same scope resolution as `checkActiveScopeUpload`); workspace team/address live at `/studio/w/$slug/settings`, never on the personal account page. Why: no personal data or quota shown inside a workspace.
- Profile-menu links come only from pure `src/lib/context-menu.ts`; the global account page is `/studio/account` (`/settings` only redirects). Dashboard totals come from `getDashboardOverview` filtered by `dashboard-scope.ts`, cached 60 s SWR per user+scope in `dashboard-cache.ts`. Why: one tested rule for scope-aware navigation and statistics.
- Credential hashes are verified only via `src/lib/auth/credential-hash.server.ts` (Better Auth scrypt + migrated legacy pbkdf2$). Why: users moved from the dropped legacy column keep their password.
- Authenticated server functions run inside `withDbContext` (src/lib/neon.ts), so each query is a transaction that first sets `rout.user_id`/`rout.workspace_id`; RLS never trusts `rout.workspace_id`. Why: RLS can only be enforced when the database knows the caller.
- Profile glass/scoped styling comes only from pure `src/lib/theme-engine.ts` (global `glass*` prefs + `themeOverrides[scope]`). Why: one rule for the Studio controls and the public page.
- Security events are written only via `recordSecurityEvent` (audit-log.server.ts) into append-only, DB-hash-chained `security_audit_logs` (db/0127); rules in pure audit-chain.ts. Why: tampering must be provable.

- Rate limits: two-bucket sliding window (`decideSlidingLimit`) over Neon `rate_limits`; public routes use `guardShared`. Why: no boundary bursts, shared across workers.
- Custom-domain "/" redirects come only from pure `root-redirect.ts` (db/0128), applied in src/start.ts. Why: one tested rule, no open redirects.
- Identity tiers: identity_verifications holds the immutable first proof; tier flags, nullifiers and the legal name live on verified_identities, and tier 1 -> tier 2 upgrades are decided only by `verificationDecision` (identity-tiers.ts). Why: a real human must be able to add the blue mark without breaking immutability.
- Developer Console apps and API keys are listed/created per active scope (workspace_id null = personal). Why: no keys or apps cross personal/workspace scopes.
- Steam status is read only via `/api/public/steam/$handle` (steam-presence.server.ts, 5-min cache), requires the `steamPresence` opt-in and a public profile; card effects are CSS-only classes from `cardEffectClasses`. Why: visitors never contact Steam and effects stay battery-friendly.
