import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSignIn, useSignUp, useAuth } from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";
import { Instagram, LoaderCircle, Mail, MessageCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Banjg Property" }] }),
  component: LoginPage,
});

type Mode = "signIn" | "signUp";

function LoginPage() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signIn, fetchStatus: signInFetch } = useSignIn();
  const { signUp, fetchStatus: signUpFetch } = useSignUp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [mode, setMode] = useState<Mode>("signIn");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (authLoaded && isSignedIn) void navigate({ to: "/", replace: true });
  }, [authLoaded, isSignedIn, navigate]);

  const loading = signInFetch === "fetching" || signUpFetch === "fetching";

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !signUp) return;
    setError("");

    // Try sign-in first (sends code if user exists)
    const { error: siErr } = await signIn.emailCode.sendCode({ emailAddress: email });
    if (!siErr) {
      setMode("signIn");
      setStep("otp");
      return;
    }

    // If user not found, start sign-up flow.
    // sendCode returns ClerkAPIResponseError; the real code is in errors[0].code.
    const siCode: string =
      (siErr as { errors?: { code?: string }[] }).errors?.[0]?.code ??
      (siErr as { code?: string }).code ??
      "";
    if (
      siCode === "form_identifier_not_found" ||
      siCode === "form_param_value_invalid"
    ) {
      const { error: suErr } = await signUp.create({ emailAddress: email });
      if (suErr) {
        setError(suErr.longMessage ?? suErr.message ?? "Failed to create account.");
        return;
      }
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) {
        setError(sendErr.longMessage ?? sendErr.message ?? "Failed to send code.");
        return;
      }
      setMode("signUp");
      setStep("otp");
      return;
    }

    const siMsg =
      (siErr as { errors?: { longMessage?: string; message?: string }[] }).errors?.[0]?.longMessage ??
      (siErr as { errors?: { message?: string }[] }).errors?.[0]?.message ??
      siErr.longMessage ??
      siErr.message ??
      "Failed to send code.";
    setError(siMsg);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || !signUp) return;
    setError("");

    if (mode === "signIn") {
      const { error: verifyErr } = await signIn.emailCode.verifyCode({ code: otp });
      if (verifyErr) { setError(verifyErr.longMessage ?? verifyErr.message ?? "Invalid code."); return; }
      const { error: finalErr } = await signIn.finalize();
      if (finalErr) { setError(finalErr.longMessage ?? finalErr.message ?? "Sign-in failed."); return; }
    } else {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code: otp });
      if (verifyErr) { setError(verifyErr.longMessage ?? verifyErr.message ?? "Invalid code."); return; }
      // verifyEmailCode completes the sign-up and creates the session automatically;
      // calling finalize() after is not needed and causes "no created session" error.
    }

    void navigate({ to: "/", replace: true });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  if (!authLoaded || isSignedIn) {
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
          <h2 className="text-2xl font-semibold tracking-tight">Welcome</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in or create your property workspace account.
          </p>

          {step === "email" ? (
            <form className="mt-7 space-y-4" onSubmit={(e) => void sendOtp(e)}>
              <label className="block text-sm font-medium">
                Work email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  className="mt-1.5 h-11 w-full rounded-md border bg-background px-3 font-normal outline-none focus:border-ring"
                />
              </label>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <button
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Continue with email
              </button>
            </form>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={(e) => void verifyOtp(e)}>
              <p className="text-sm text-muted-foreground">
                {mode === "signUp" ? "New account — we sent a 6-digit code to " : "We sent a 6-digit code to "}
                <span className="font-medium text-foreground">{email}</span>.
              </p>
              <label className="block text-sm font-medium">
                Verification code
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="mt-1.5 h-11 w-full rounded-md border bg-background px-3 font-mono text-lg tracking-widest outline-none focus:border-ring"
                />
              </label>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <button
                disabled={loading || otp.length < 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : mode === "signUp" ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  if (signIn) void signIn.reset();
                  if (signUp) void signUp.reset();
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            or
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() =>
                showToast("Instagram login requires Meta OAuth app credentials — coming soon.")
              }
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              <Instagram className="h-4 w-4" />
              Continue with Instagram
            </button>
            <button
              onClick={() =>
                showToast("WhatsApp login is not available yet — use email to sign in.")
              }
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              Continue with WhatsApp
            </button>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Instagram and WhatsApp sign-in will be enabled once Meta OAuth app credentials and
            approved redirect URLs are configured.
          </p>
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-float">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
