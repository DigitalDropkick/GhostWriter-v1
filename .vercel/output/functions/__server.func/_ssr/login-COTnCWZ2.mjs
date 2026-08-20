import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Feather } from "../_libs/lucide-react.mjs";
import { n as GROK_PROVIDERS } from "./router-BTsMeNrw.mjs";
import { r as signIn, t as Button } from "./client-BkjfwqwJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-COTnCWZ2.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "paper-grain grid min-h-dvh place-items-center px-5 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md space-y-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-2 font-serif text-2xl text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: "size-5 text-moss" }), "Ghostwriter"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-serif text-4xl text-ink",
							children: "Sign in (optional)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-lg leading-relaxed text-ink-soft",
							children: "You do not need an account to write. Your book already lives on this computer. Sign in only if you want a named session on this device."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "xl",
						className: "w-full",
						onClick: () => void signIn(p.providerId, { callbackURL: "/" }),
						children: ["Continue with ", p.label]
					}, p.providerId))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "inline-flex h-12 items-center text-lg text-moss underline-offset-4 hover:underline",
					children: "Back to the writing room"
				})
			]
		})
	});
}
//#endregion
export { Login as component };
