import { createRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

const pageNonce = createIsomorphicFn()
  .server(() => getRequestHeader("x-ghostwriter-nonce"))
  .client(() => document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce);

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    ssr: { nonce: pageNonce() },
  });
}
