import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { BookProvider } from "@/lib/book-store";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Ghostwriter";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#3F5C4A" },
      {
        name: "description",
        content:
          "Speak your story. Ghostwriter sets it on the page in your voice, ready to read, hear, and print.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="paper-grain min-h-dvh bg-paper text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <BookProvider>
            <Outlet />
            <Toaster
              position="top-center"
              toastOptions={{
                className:
                  "font-sans text-lg bg-paper text-ink border border-rule shadow-lg",
              }}
            />
          </BookProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
