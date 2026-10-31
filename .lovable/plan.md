# ROUT security hardening: clusters A t/m E

## Stap 0: Voorbereiding
- Projectregels lezen (`AGENTS.md`, `src/lib/AGENTS.md`, `src/lib/oauth/AGENTS.md`, `docs/identity-broker-preflight.md`, `roadmap.md`).
- Neon koppelen via de connect-kaart (Neon-connector), zodat `NEON_API_KEY` beschikbaar is; daarna live `schema-snapshot.ts --check`.
- Basislijn vastleggen: `bun test` + `bunx tsgo --noEmit` vóór wijzigingen. Bestaande fouten apart noteren.
- Openstaande taken in `roadmap.md` zetten.

Gecorrigeerde paden (in de code gecontroleerd):
- OAuth step-up OTP zit in `src/lib/oauth/provider.server.ts` / `console.functions.ts` (`createStepUpCode`), met regels in `src/lib/oauth/step-up.ts`. Er bestaat geen `oauth/step-up.server.ts`.
- Last.fm staat in `src/lib/integrations/lastfm.server.ts` + `src/routes/api_.public.lastfm.$handle.ts`.

## Cluster A: Account merge (`account-merge.server.ts` / `.functions.ts`)
- Hele merge (ticket claimen, overzetten, design-snapshot, secundair account verwijderen) in één `withDbContext`-transactie. Fouten gooien door, geen `catch {}`.
- Ticket claimen via `UPDATE ... WHERE used_at IS NULL AND secondary_user_id = $me AND expires_at > now() RETURNING`, binnen dezelfde transactie.
- De dynamische zoektocht in `information_schema` (regel ~155) vervangen door een vaste `MERGE_TABLES`-allowlist in een nieuwe pure `account-merge-rules.ts`. Per tabel een strategie: `reassign`, `dedupe_keep_primary` of `skip`. `identity_verifications`, `verified_identities` en `identity_links` worden altijd overgeslagen.
- Keuze-invoer met zod `z.enum(["primary","secondary"])`; al het andere wordt geweigerd.
- Verse step-up verplicht op beide accounts: bij het aanmaken van het ticket (primair) en bij het verzilveren (secundair). Hergebruikt Cluster B.
- `countMergeFailures` faalt dicht: een databasefout betekent weigeren.
- Better Auth `account`/`passkey`: als dezelfde provider op beide accounts staat, wordt de secundaire rij in een archieftabel gezet en verwijderd. E-mail wordt nooit overschreven.
- Migratie `0140_account_merge_hardening.sql` (archieftabel, index en eventueel kolommen op het ticket).
- Tests in `src/lib/account-merge.test.ts`: rollback bij gedeeltelijke fout, ongeldige keuze, ticket replay, rate limit, uitsluiting van identiteitstabellen.

## Cluster B: Step-up + WebAuthn
- OTP-hash wordt `v2$HMAC-SHA256(secret, userId:clientId:requestId:code)` met een server-geheim. Er wordt geen nieuw geheim gegenereerd: een bestaand geheim wordt via een HKDF-label afgeleid, of er komt een nieuwe secret-naam die ik je dan vraag.
- Geldigheid: 5 minuten. Verificatie in één conditionele `UPDATE ... WHERE attempts < 5 AND verified_at IS NULL AND expires_at > now() RETURNING`.
- Het step-up-bewijs wordt gebonden aan `authorization_request_id` + `client_id`, mag één keer gebruikt worden, en wordt bij het uitgeven van de code verbruikt.
- WebAuthn: een eenmalige challenge per autorisatieverzoek, gecontroleerd met de verificatie die Better Auth's passkey-plugin al gebruikt (`@simplewebauthn/server`). Daarbij worden RP ID, origin, UP/UV, handtekening en counter gecontroleerd.
- Migratie `0141_step_up_binding.sql` (request-binding, challenge-tabel).
- Tests: ongeldige origin, verlopen challenge, pogingen op, hergebruik.

## Cluster C: Scopes + pairwise
- `allowed_scopes` wordt een harde whitelist in `/oauth/authorize` én `/oauth/token` (ook bij refresh), via een pure functie in `scope-rules.ts`. Scopes buiten de lijst geven `invalid_scope`, nog vóór de consentstap.
- Pairwise: `usr_rout_` + HMAC met `ROUT_PROVIDER_PAIRWISE_SECRET`. Dit wordt standaard voor nieuwe clients; legacy clients houden `public` tot een expliciete opt-in (kolom in migratie `0142`). Ik controleer eerst de bestaande `pairwiseSubject`, zodat huidige pairwise-subjects niet veranderen.
- `app_sybil_nullifier` wordt alleen berekend als `sybil:verify` gevraagd én toegestaan is.
- Tests voor de whitelist, de pairwise-vorm/-stabiliteit en de nullifier.

## Cluster D: Wallet + Last.fm
- `pass-generator.server.ts` haalt assets op vanaf een vaste, canonieke origin (configuratie, met `https://rout.be` als standaard) in plaats van `url.origin`.
- Event-passes krijgen het label "informatief". Een barcode of toegangsclaim komt er alleen bij een betaalde of geverifieerde boeking. Test toevoegen.
- Last.fm: 30 s cache, `guardShared` rate limit, en een nette 200/204 met een lege status als `LASTFM_API_KEY` ontbreekt.

## Cluster E: Schema drift
- `91_shadowban.sql` blijft ongewijzigd. Live grants worden vergeleken met de replay. Waar dat nodig is, komt er `0143_schema_grants_alignment.sql` (de nummering volgt de eerdere deltas). Checksum-drift wordt gedocumenteerd in `docs/`.

## Verificatie (na elk cluster)
- `bunx tsgo --noEmit`, `bun test`, `bun scripts/schema-replay-snapshot.ts`.
- Migraties live toepassen pas na jouw akkoord per statement.
- `roadmap.md` afvinken met testbewijzen.

## Nodig van jou
- Neon-koppeling (connect-kaart).
- Voor live e2e: de geheimen uit sectie 4, via het beveiligde formulier. Bestaande waarden worden nooit vervangen.
