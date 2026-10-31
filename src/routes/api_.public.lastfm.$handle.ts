import { createFileRoute } from "@tanstack/react-router";

/** Public, cached Last.fm "now playing" for an opted-in profile. Visitors never contact Last.fm. */
export const Route = createFileRoute("/api_/public/lastfm/$handle")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { guardRequest } = await import("@/lib/api-guard.server");
        const limited = guardRequest(request, "lastfm-public", 120, 60000);
        if (limited) return limited;
        const headers = { "cache-control": "public, max-age=30" };
        const { LASTFM_IDLE } = await import("@/lib/integrations/lastfm");
        const handle = params.handle.replace(/^@/, "").slice(0, 64);
        try {
          const s = await import("@/lib/integrations/lastfm.server");
          const user = await s.publicLastfmUser(handle);
          if (!user) return Response.json(LASTFM_IDLE, { headers });
          return Response.json(await s.lastfmStatusFor(user), { headers });
        } catch (e) {
          console.error("[lastfm-public]", e instanceof Error ? e.message : e);
          return Response.json(LASTFM_IDLE, { headers });
        }
      },
    },
  },
});
