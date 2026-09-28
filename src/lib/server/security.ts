export async function securityHeaders(
  html = "",
  development = false,
  nonce?: string,
): Promise<Headers> {
  const hashes: string[] = [];
  // Only our build-generated/static or React-escaped shell is rendered on the server.
  // SSR uses TanStack's per-response nonce; static documents use exact content hashes.
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1]) || !match[2]) continue;
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(match[2]));
    hashes.push(`'sha256-${btoa(String.fromCharCode(...new Uint8Array(bytes)))}'`);
  }
  return new Headers({
    "Content-Security-Policy": [
      "default-src 'none'",
      `script-src 'self' 'wasm-unsafe-eval' ${nonce ? "'nonce-" + nonce + "'" : hashes.join(" ")}${development ? " 'unsafe-inline'" : ""}`,
      // React inline styles, Radix scroll locking and Sonner style elements require this.
      // There are no remotely hosted styles and no unsafe-inline script permission in production.
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      `connect-src 'self' https://huggingface.co https://us.aws.cdn.hf.co${development ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
      "manifest-src 'self'",
      "base-uri 'none'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "microphone=(self), camera=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Resource-Policy": "same-origin",
  });
}

export async function secureResponse(
  response: Response,
  request: Request,
  development = false,
  nonce?: string,
) {
  const html = response.headers.get("content-type")?.includes("text/html")
    ? await response.text()
    : null;
  const headers = new Headers(response.headers);
  (await securityHeaders(html ?? "", development, nonce)).forEach((value, key) =>
    headers.set(key, value),
  );
  headers.delete("set-cookie");
  headers.delete("content-length");
  if (new URL(request.url).protocol === "https:") {
    // Host only: do not assume control over unrelated subdomains or preload eligibility.
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }
  if (html !== null || new URL(request.url).pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "no-store");
  }
  return new Response(html ?? response.body, { status: response.status, headers });
}
