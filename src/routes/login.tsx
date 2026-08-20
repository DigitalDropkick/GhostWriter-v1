import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Feather } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="paper-grain grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-serif text-2xl text-ink">
            <Feather className="size-5 text-moss" />
            Ghostwriter
          </p>
          <h1 className="font-serif text-4xl text-ink">Sign in (optional)</h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            You do not need an account to write. Your book already lives on this
            computer. Sign in only if you want a named session on this device.
          </p>
        </div>
        {authEnabled ? (
          <div className="space-y-3">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="secondary"
                size="xl"
                className="w-full"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-ink-soft">Sign-in is turned off.</p>
        )}
        <Link
          to="/"
          className="inline-flex h-12 items-center text-lg text-moss underline-offset-4 hover:underline"
        >
          Back to the writing room
        </Link>
      </div>
    </main>
  );
}
