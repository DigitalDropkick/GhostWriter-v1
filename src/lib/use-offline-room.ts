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
      setStatus("Offline reopening is not available in this preview.");
      return;
    }
    if (!("serviceWorker" in navigator)) {
      setStatus("Offline reopening is unavailable in this browser.");
      return;
    }
    let alive = true;
    let timer: number | undefined;
    const readyMessage = "Ready to reopen offline. Dictation needs its speech download first.";
    const verify = async (worker: ServiceWorker | null, waiting = false) => {
      if (!worker) return false;
      const ready = await new Promise<boolean>((resolve) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
          channel.port1.close();
          resolve(false);
        }, 15000);
        channel.port1.onmessage = (event: MessageEvent<{ ready?: boolean }>) => {
          window.clearTimeout(timeout);
          channel.port1.close();
          resolve(event.data?.ready === true);
        };
        worker.postMessage({ type: "OFFLINE_STATUS", repair: navigator.onLine }, [channel.port2]);
      });
      if (alive)
        setStatus(
          ready
            ? waiting
              ? "Ready to reopen offline. An update is ready for the next time all Ghostwriter windows are closed."
              : readyMessage
            : "Offline setup is incomplete. Keep this page open and reconnect to the internet to try again.",
        );
      return ready;
    };
    // A controller alone is not proof that all of the offline files are still present.
    if (navigator.serviceWorker.controller) void verify(navigator.serviceWorker.controller);
    const recheck = () => {
      void verify(navigator.serviceWorker.controller);
    };
    window.addEventListener("online", recheck);
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
        if (alive) await verify(registration.active, Boolean(registration.waiting));
      })
      .catch(() => {
        window.clearTimeout(timer);
        if (alive && navigator.serviceWorker.controller)
          void verify(navigator.serviceWorker.controller);
        else if (alive)
          setStatus("Offline setup did not finish. Reopen with internet to try again.");
      });
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.removeEventListener("online", recheck);
    };
  }, []);
  return { status, offline };
}
