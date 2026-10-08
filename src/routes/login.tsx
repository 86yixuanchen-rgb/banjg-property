import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Instagram, LoaderCircle, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth, type AuthProviderName } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Banjg Property" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState<AuthProviderName | null>(null);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/", replace: true });
  }, [navigate, ready, user]);

  const complete = (nextProvider: AuthProviderName, nextEmail: string, name: string) => {
    setProvider(nextProvider);
    window.setTimeout(() => {
      signIn({ provider: nextProvider, email: nextEmail, name });
      void navigate({ to: "/", replace: true });
    }, 450);
  };

  if (!ready || user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-primary">
            K
          </span>
          Banjg Property
        </div>
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Every repair, conversation and next step in one place.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/75">
            Coordinate tenants, landlords and trades with an AI-assisted workspace built for
            property managers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
          <ShieldCheck className="h-4 w-4" /> Secure workspace access
        </div>
      </section>
      <section className="flex items-center justify-center bg-card px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary font-semibold text-primary-foreground">
              K
            </div>
            <div className="mt-3 font-semibold">Banjg Property</div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your property workspace.</p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              complete("email", email, email.split("@")[0] || "Property manager");
            }}
          >
            <label className="block text-sm font-medium">
              Work email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@agency.com"
                className="mt-1.5 h-11 w-full rounded-md border bg-background px-3 font-normal outline-none focus:border-ring"
              />
            </label>
            <button
              disabled={provider !== null}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {provider === "email" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Continue with email
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            or
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() => complete("instagram", "instagram@connected.local", "Instagram user")}
              disabled={provider !== null}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              {provider === "instagram" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Instagram className="h-4 w-4" />
              )}
              Continue with Instagram
            </button>
            <button
              onClick={() => complete("whatsapp", "whatsapp@connected.local", "WhatsApp user")}
              disabled={provider !== null}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              {provider === "whatsapp" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Continue with WhatsApp
            </button>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Instagram and WhatsApp buttons use the product flow now; production Meta OAuth will be
            enabled when the Meta app credentials and approved redirect URLs are configured.
          </p>
        </div>
      </section>
    </main>
  );
}
