import { createFileRoute } from "@tanstack/react-router";

const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { Location: location } });

export const Route = createFileRoute("/api/gmail/connect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { auth } = await import("@clerk/tanstack-react-start/server");
        const { GMAIL_SCOPES, googleConfig } = await import("@/lib/gmail.server");
        const { userId } = await auth();
        const url = new URL(request.url);
        if (!userId) return redirect(`${url.origin}/login`);

        const cfg = googleConfig(url.origin);
        const state = crypto.randomUUID();
        const params = new URLSearchParams({
          client_id: cfg.clientId,
          redirect_uri: cfg.redirectUri,
          response_type: "code",
          scope: GMAIL_SCOPES,
          access_type: "offline",
          prompt: "consent",
          state,
        });
        const secure = url.protocol === "https:" ? "; Secure" : "";
        return new Response(null, {
          status: 302,
          headers: {
            Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
            "Set-Cookie": `gmail_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/gmail; Max-Age=600${secure}`,
          },
        });
      },
    },
  },
});
