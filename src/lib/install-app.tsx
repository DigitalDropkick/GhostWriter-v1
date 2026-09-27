import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const InstallContext = createContext({
  available: false,
  installed: false,
  install: async () => "unavailable" as string,
});

export function InstallProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(
      matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    const offer = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  async function install() {
    if (!prompt) return "unavailable";
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      setPrompt(null);
      return result.outcome;
    } catch {
      return "failed";
    }
  }
  return (
    <InstallContext.Provider value={{ available: !!prompt, installed, install }}>
      {children}
    </InstallContext.Provider>
  );
}
// This small provider and its hook intentionally share their private context.
// eslint-disable-next-line react-refresh/only-export-components
export const useInstallApp = () => useContext(InstallContext);
