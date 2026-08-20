import { createFileRoute } from "@tanstack/react-router";
import { GhostwriterApp } from "@/components/ghostwriter-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GhostwriterApp />;
}
