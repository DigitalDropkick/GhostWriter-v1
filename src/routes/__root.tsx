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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "theme-color", content: "#183e35" },
      {
        name: "description",
        content:
          "Speak your story. Ghostwriter sets it on the page in your voice, ready to read, hear, and print.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/ghostwriter.webmanifest" },
      { rel: "apple-touch-icon", href: "/ghostwriter-icons/icon-180.png" },
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
              position="bottom-center"
              visibleToasts={1}
              closeButton
              toastOptions={{
                className:
                  "font-sans text-lg bg-paper text-ink border border-rule shadow-lg",
                style: {
                  fontFamily: "var(--font-sans)",
                  fontSize: "1rem",
                  background: "var(--color-paper)",
                  color: "var(--color-ink)",
                  borderColor: "var(--color-rule)",
                },
              }}
            />
          </BookProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
