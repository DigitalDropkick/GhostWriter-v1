import { useEffect, useState } from "react";

// Fail closed in the UI too. This endpoint never returns identity or credentials.
export function useOnlineHelp() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/features", {
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        setEnabled(result.onlineWritingHelp === true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return enabled;
}
