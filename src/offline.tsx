// The same router and components, with no request/identity state or hydration payload.
// This entry is used only by the verified static offline shell.
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

export async function mountOfflineRoom() {
  const router = getRouter();
  await router.load();
  createRoot(document).render(<RouterProvider router={router} />);
}
