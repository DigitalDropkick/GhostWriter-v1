export function errorPage(message: string, requestId: string, status: number) {
  // Both strings come from fixed application messages or a generated UUID, never the request.
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Ghostwriter</title><style>body{margin:0;background:#f6f0e5;color:#2a241c;font:18px/1.6 system-ui,sans-serif;padding:clamp(24px,8vw,90px)}main{max-width:36rem;margin:auto}small{color:#5e564c;overflow-wrap:anywhere}h1{font:clamp(30px,7vw,48px)/1.2 Georgia,serif}a{display:inline-block;margin:20px 0;padding:14px 24px;background:#183e35;color:#f6f0e5;border-radius:14px;text-decoration:none}a:focus-visible{outline:3px solid #8e6c36;outline-offset:4px}</style></head><body><main><p>GHOSTWRITER · DIGITAL DROPKICK</p><h1>Let’s get you back to your writing.</h1><p>${message}</p><a href="/">Try opening again</a><p><small>If you need help, give Digital Dropkick this reference: ${requestId}</small></p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
