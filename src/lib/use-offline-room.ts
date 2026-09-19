import { useEffect, useState } from "react";

export function useOfflineRoom() {
  const [status, setStatus] = useState("Preparing offline writing…");
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD) {
      setStatus("Offline setup is available in the release build.");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      setStatus("Offline reopening is unavailable in this browser.");
      return;
    }
    let alive = true;
    let timer: number | undefined;
    const readyMessage = "Ready to reopen offline. Dictation needs its speech download first.";
    // An offline update check may fail even when this app is already cached.
    if (navigator.serviceWorker.controller) setStatus(readyMessage);
    void navigator.serviceWorker
      .register("/ghostwriter-sw.js", { scope: "/", updateViaCache: "none" })
      .then(async (registration) => {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => {
            timer = window.setTimeout(() => reject(new Error("timeout")), 45000);
          }),
        ]);
        window.clearTimeout(timer);
        if (alive)
          setStatus(
            registration.waiting
              ? "An update is ready. Close all Ghostwriter windows after saving to use it."
              : readyMessage,
          );
      })
      .catch(() => {
        window.clearTimeout(timer);
        if (alive)
          setStatus(
            navigator.serviceWorker.controller
              ? readyMessage
              : "Offline setup did not finish. Reopen with internet to try again.",
          );
      });
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);
  return { status, offline };
}
