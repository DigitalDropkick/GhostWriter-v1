import handler from "@tanstack/react-start/server-entry";
import { validateAccess, AccessError, type AccessConfig } from "./src/lib/server/access";
import { secureResponse } from "./src/lib/server/security";
import {
  onlineHelpEnabled,
  writingHelp,
  type OnlineHelpConfig,
} from "./src/lib/server/online-help";
import { errorPage } from "./src/lib/server/error-page";

export type Env = AccessConfig &
  OnlineHelpConfig & {
    ASSETS: { fetch(request: Request): Promise<Response> };
  };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
    const url = new URL(request.url);
    // This branch is removed by the production build. No env/header/URL bypass exists in a release.
    const localDevelopment =
      import.meta.env.DEV && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    let response: Response;
    try {
      const identity = localDevelopment ? null : await validateAccess(request, env);
      if (url.pathname === "/api/features") {
        response = ["GET", "HEAD"].includes(request.method)
          ? Response.json({ onlineWritingHelp: !!identity && onlineHelpEnabled(env) })
          : new Response("This action is unavailable.", { status: 405 });
      } else if (url.pathname === "/api/writing-help") {
        response = identity
          ? await writingHelp(request, env, identity)
          : Response.json(
              { ok: false, error: "Online writing help is unavailable in local development." },
              { status: 503 },
            );
      } else if (["/api/transcribe", "/api/tts"].includes(url.pathname)) {
        response = Response.json(
          { error: "Recordings and reading stay on your device." },
          { status: 410 },
        );
      } else if (!["GET", "HEAD"].includes(request.method)) {
        response = new Response("This action is unavailable.", { status: 405 });
      } else if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/_serverFn/") ||
        url.pathname.startsWith("/auth/")
      ) {
        response = new Response("This page is unavailable.", { status: 404 });
      } else if (url.pathname === "/" || url.pathname === "/start") {
        const cleanHeaders = new Headers(request.headers);
        cleanHeaders.delete("cf-access-jwt-assertion");
        cleanHeaders.delete("cookie");
        cleanHeaders.delete("authorization");
        // Always overwrite this internal header; never trust a caller-supplied nonce.
        cleanHeaders.set("x-ghostwriter-nonce", nonce);
        response = await handler.fetch(new Request(request, { headers: cleanHeaders }));
      } else {
        // The generic shell never contains identity, tokens, cookies or manuscripts.
        const assetUrl = new URL(request.url);
        if (!localDevelopment) assetUrl.search = "";
        // Strip all credentials before internal asset lookup.
        response = await env.ASSETS.fetch(
          new Request(assetUrl, {
            method: request.method,
            // Vite distinguishes stylesheet/module requests during development.
            headers: localDevelopment
              ? { accept: request.headers.get("accept") ?? "*/*" }
              : undefined,
          }),
        );
      }
    } catch (error) {
      const status = error instanceof AccessError ? error.status : 500;
      const code = error instanceof AccessError ? error.code : "application_error";
      // No path/query is logged: titles may appear in URLs. Fixed error class only.
      console.warn(
        JSON.stringify({ requestId, status, error: code, durationMs: Date.now() - start }),
      );
      const message =
        status === 401
          ? "Please sign in again to open Ghostwriter. Saved books remain on this device."
          : status === 503
            ? "The writing room is not ready to open. Please contact Digital Dropkick. Do not clear this device’s saved data."
            : "The writing room could not open. Please try again. Do not clear this device’s saved data.";
      response =
        request.headers.get("accept")?.includes("text/html") && !url.pathname.startsWith("/api/")
          ? errorPage(message, requestId, status)
          : Response.json({ error: message, requestId }, { status });
    }
    if (response.status === 404 && request.headers.get("accept")?.includes("text/html")) {
      response = errorPage(
        "This page is not here. Open the writing room to return to your books.",
        requestId,
        404,
      );
    }
    const renderedPage = url.pathname === "/" || url.pathname === "/start";
    const result = await secureResponse(
      response,
      request,
      localDevelopment,
      renderedPage ? nonce : undefined,
    );
    result.headers.set("X-Request-Id", requestId);
    if (url.pathname === "/ghostwriter-sw.js") result.headers.set("Cache-Control", "no-cache");
    return result;
  },
};
