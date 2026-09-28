import type { BookKind, PolishLevel } from "./types";

export async function shapeDictation({
  data,
}: {
  data: {
    transcript: string;
    kind: BookKind;
    polish: PolishLevel;
    voiceNotes: string;
    onlineConsent: true;
  };
}): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/writing-help", {
      method: "POST",
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(35000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.status === 401 || response.status === 403) throw new Error("Unauthorized");
    const result = await response.json();
    if (response.ok && result.ok === true && typeof result.body === "string") return result;
    return {
      ok: false,
      error:
        typeof result.error === "string"
          ? result.error
          : "Writing help could not finish. Your original words are unchanged.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") throw error;
    return {
      ok: false,
      error:
        "Writing help could not connect. Your original words are unchanged. Check your connection or sign in again.",
    };
  }
}
