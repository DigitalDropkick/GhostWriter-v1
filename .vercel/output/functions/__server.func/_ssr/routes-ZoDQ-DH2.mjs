import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { a as Settings, c as Pause, d as Keyboard, f as Feather, i as Square, l as Mic, n as Type, o as Printer, p as BookOpen, s as Play, t as Upload, u as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as downloadText, d as uid, f as wordCount, l as formatClock, o as useBook, p as loadAudio, u as formatLongDate } from "./router-BTsMeNrw.mjs";
import { i as signOut, n as authClient, t as Button } from "./client-BkjfwqwJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ZoDQ-DH2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KIND_LABEL = {
	memoir: "A life story",
	family: "Family stories",
	novel: "A novel",
	other: "Something else"
};
var POLISH_LABEL = {
	faithful: "Keep my words",
	light: "Clean them up a little",
	literary: "Shape them into chapters"
};
var POLISH_HELP = {
	faithful: "We add punctuation and paragraphs. Your sentences stay as you said them.",
	light: "We fix false starts and speech-to-text mistakes, and make the paragraphs easy to read. It still sounds like you.",
	literary: "We turn rambling talk into a clear chapter, keeping your voice, humor, and the way you tell a story. We do not invent facts."
};
var KINDS = [
	"memoir",
	"family",
	"novel",
	"other"
];
var POLISH = [
	"faithful",
	"light",
	"literary"
];
function WelcomeFlow({ onEnterDesk }) {
	const { createBook, setCurrent, state } = useBook();
	const [step, setStep] = (0, import_react.useState)(0);
	const [author, setAuthor] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("memoir");
	const [polish, setPolish] = (0, import_react.useState)("light");
	const sample = state.books.find((b) => b.isSample);
	function finish() {
		createBook({
			title: title || "My Story",
			author: author || "Anonymous",
			kind,
			polish,
			voiceNotes: ""
		});
		onEnterDesk();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-5 py-12 sm:px-8",
		children: [
			step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold tracking-[0.22em] text-moss uppercase",
								children: "Ghostwriter"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "font-serif text-4xl leading-tight text-ink sm:text-5xl",
								children: [
									"Speak your story.",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"We'll set it on the page in your voice."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-xl text-xl leading-relaxed text-ink-soft",
								children: "Talk the way you talk. We listen, write it down, turn it into a book you can read, hear, and print — without you having to type."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "space-y-4 text-lg text-ink-soft",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-bold text-moss-fg",
									children: "1"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Press ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-ink",
										children: "Talk"
									}),
									" and tell a memory."
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-bold text-moss-fg",
									children: "2"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "We put it on the page, sounding like you." })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-bold text-moss-fg",
									children: "3"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Read it, listen to it, or print it whenever you like." })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "xl",
							onClick: () => setStep(1),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: "size-5" }), "Start my book"]
						}), sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "xl",
							variant: "secondary",
							onClick: () => {
								setCurrent(sample.id);
								onEnterDesk();
							},
							children: "Look at a sample first"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base text-ink-faint",
						children: "Your words stay on this computer. Nothing is kept to train anyone else's system."
					})
				]
			}) : null,
			step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Question, {
				kicker: "Your name",
				title: "What name should go on the title page?",
				hint: "This is the byline. You can change it later.",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					value: author,
					onChange: (e) => setAuthor(e.target.value),
					placeholder: "For example: James Whitaker",
					className: "h-16 w-full rounded-[18px] border border-rule bg-paper px-5 text-xl outline-none focus:border-moss"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
					onBack: () => setStep(0),
					onNext: () => setStep(2),
					nextLabel: "Next"
				})]
			}) : null,
			step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Question, {
				kicker: "The book",
				title: "What do you want to call it?",
				hint: "A working title is fine. “My Story” works too.",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					value: title,
					onChange: (e) => setTitle(e.target.value),
					placeholder: "My Story",
					className: "h-16 w-full rounded-[18px] border border-rule bg-paper px-5 text-xl outline-none focus:border-moss"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
					onBack: () => setStep(1),
					onNext: () => setStep(3),
					nextLabel: "Next"
				})]
			}) : null,
			step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Question, {
				kicker: "Kind of book",
				title: "What are you telling?",
				hint: "This only helps the writing. You can switch later.",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3",
					children: KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						selected: kind === k,
						title: KIND_LABEL[k],
						onClick: () => setKind(k)
					}, k))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
					onBack: () => setStep(2),
					onNext: () => setStep(4),
					nextLabel: "Next"
				})]
			}) : null,
			step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Question, {
				kicker: "Your voice",
				title: "How should we treat your words?",
				hint: "You can try one way and change it on the next chapter.",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3",
					children: POLISH.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						selected: polish === p,
						title: POLISH_LABEL[p],
						body: POLISH_HELP[p],
						onClick: () => setPolish(p)
					}, p))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {
					onBack: () => setStep(3),
					onNext: finish,
					nextLabel: "Open the writing room",
					icon: true
				})]
			}) : null
		]
	});
}
function Question({ kicker, title, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold tracking-[0.22em] text-moss uppercase",
					children: kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-serif text-4xl leading-tight text-ink",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg text-ink-soft",
					children: hint
				})
			]
		}), children]
	});
}
function Choice({ selected, title, body, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `rounded-[20px] border px-5 py-4 text-left transition-colors ${selected ? "border-moss bg-paper-deep" : "border-rule bg-paper hover:bg-paper-deep"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xl font-bold text-ink",
			children: title
		}), body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-base leading-relaxed text-ink-soft",
			children: body
		}) : null]
	});
}
function Nav({ onBack, onNext, nextLabel, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 pt-2 sm:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "xl",
			onClick: onNext,
			children: [icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-5" }) : null, nextLabel]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "xl",
			variant: "quiet",
			onClick: onBack,
			children: "Back"
		})]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var shapeDictation = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("10dbb69cee6c1110faefb949a6db02a534a007c9d17eaa87e115acec62ad84d8"));
function getSpeechRecognizer() {
	const w = window;
	const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
	return Ctor ? new Ctor() : null;
}
function pickMime() {
	const types = [
		"audio/webm;codecs=opus",
		"audio/webm",
		"audio/mp4",
		"audio/ogg"
	];
	if (typeof MediaRecorder === "undefined") return void 0;
	return types.find((t) => MediaRecorder.isTypeSupported(t));
}
function TalkFlow({ onClose, startInType }) {
	const { book, chapter, addChapter, updateChapter, addSession } = useBook();
	const [phase, setPhase] = (0, import_react.useState)(startInType ? "review" : "idle");
	const [seconds, setSeconds] = (0, import_react.useState)(0);
	const [live, setLive] = (0, import_react.useState)("");
	const [transcript, setTranscript] = (0, import_react.useState)("");
	const [micError, setMicError] = (0, import_react.useState)(null);
	const [destination, setDestination] = (0, import_react.useState)("append");
	const [note, setNote] = (0, import_react.useState)(null);
	const [busyLabel, setBusyLabel] = (0, import_react.useState)("Setting your words on the page…");
	const mediaRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const streamRef = (0, import_react.useRef)(null);
	const recRef = (0, import_react.useRef)(null);
	const keepListening = (0, import_react.useRef)(false);
	const startedAt = (0, import_react.useRef)(0);
	const audioBlob = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (phase !== "recording") return;
		const id = window.setInterval(() => {
			setSeconds(Math.floor((Date.now() - startedAt.current) / 1e3));
		}, 250);
		return () => window.clearInterval(id);
	}, [phase]);
	(0, import_react.useEffect)(() => {
		return () => stopEverything();
	}, []);
	function stopEverything() {
		keepListening.current = false;
		try {
			recRef.current?.stop();
		} catch {}
		recRef.current = null;
		if (mediaRef.current && mediaRef.current.state !== "inactive") try {
			mediaRef.current.stop();
		} catch {}
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
	}
	async function startTalking() {
		setMicError(null);
		setLive("");
		chunksRef.current = [];
		audioBlob.current = null;
		keepListening.current = true;
		startedAt.current = Date.now();
		setSeconds(0);
		setPhase("recording");
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const mime = pickMime();
			const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : void 0);
			mediaRef.current = recorder;
			recorder.ondataavailable = (ev) => {
				if (ev.data.size) chunksRef.current.push(ev.data);
			};
			recorder.onstop = () => {
				const type = recorder.mimeType || "audio/webm";
				if (chunksRef.current.length) audioBlob.current = new Blob(chunksRef.current, { type });
			};
			recorder.start(1e3);
		} catch {
			setMicError("This browser would not turn the microphone on. You can type, paste, or upload a recording instead.");
		}
		const rec = getSpeechRecognizer();
		if (rec) {
			rec.continuous = true;
			rec.interimResults = true;
			rec.lang = "en-US";
			rec.onresult = (ev) => {
				let finalText = "";
				let interim = "";
				for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
					const piece = ev.results[i][0].transcript;
					if (ev.results[i].isFinal) finalText += `${piece} `;
					else interim += piece;
				}
				if (finalText) setTranscript((prev) => `${prev} ${finalText}`.replace(/\s+/g, " ").trim());
				setLive(interim);
			};
			rec.onend = () => {
				if (keepListening.current) try {
					rec.start();
				} catch {}
			};
			rec.onerror = () => {};
			recRef.current = rec;
			try {
				rec.start();
			} catch {}
		}
	}
	async function finishTalking() {
		keepListening.current = false;
		stopEverything();
		await new Promise((r) => setTimeout(r, 120));
		setBusyLabel("Listening back through what you said…");
		setPhase("shaping");
		let text = transcript.trim();
		const blob = audioBlob.current;
		if (blob && blob.size > 400) try {
			const fd = new FormData();
			fd.append("file", blob, "session.webm");
			const json = await (await fetch("/api/transcribe", {
				method: "POST",
				body: fd
			})).json();
			if (json.ok && json.text?.trim()) text = json.text.trim();
		} catch {}
		setTranscript(text);
		setLive("");
		setPhase("review");
		setBusyLabel("Setting your words on the page…");
		if (!text) toast("I didn't catch any words. You can type them, or talk again.");
	}
	async function onUpload(file) {
		audioBlob.current = file;
		setBusyLabel("Listening to your recording…");
		setPhase("shaping");
		try {
			const fd = new FormData();
			fd.append("file", file, file.name);
			const json = await (await fetch("/api/transcribe", {
				method: "POST",
				body: fd
			})).json();
			if (json.ok && json.text?.trim()) setTranscript(json.text.trim());
			else toast(json.error || "I could not make out that recording.");
		} catch {
			toast("I could not read that file.");
		}
		setPhase("review");
		setBusyLabel("Setting your words on the page…");
	}
	async function writeIntoBook() {
		if (!book || !chapter) return;
		const spoken = transcript.trim();
		if (spoken.length < 8) {
			toast("Please talk a little more, or type a few sentences, then try again.");
			return;
		}
		setPhase("shaping");
		setNote(null);
		const sessionId = uid("sess");
		const audioId = audioBlob.current ? uid("aud") : null;
		await addSession({
			id: sessionId,
			bookId: book.id,
			chapterId: chapter.id,
			transcript: spoken,
			audioId,
			durationMs: seconds * 1e3,
			createdAt: Date.now()
		}, audioBlob.current);
		const target = destination === "new" ? addChapter(book.id, "New chapter") : chapter;
		const result = await shapeDictation({ data: {
			transcript: spoken,
			existingBody: destination === "new" ? "" : target.body,
			chapterTitle: target.title,
			bookTitle: book.title,
			author: book.author,
			kind: book.kind,
			polish: book.polish,
			voiceNotes: book.voiceNotes,
			destination
		} });
		if (result.ok) {
			updateChapter(target.id, {
				title: result.chapterTitle,
				body: result.body
			});
			setNote(result.note);
			toast(result.note);
			onClose();
		} else {
			if (!target.body) updateChapter(target.id, { body: spoken });
			else updateChapter(target.id, { body: `${target.body.trim()}\n\n${spoken}` });
			toast(result.error + " I saved your spoken words on the page so nothing is lost.");
			onClose();
		}
	}
	if (phase === "shaping") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[22rem] flex-col items-center justify-center gap-5 px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-10 animate-spin text-moss" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-serif text-3xl text-ink",
				children: busyLabel
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-lg text-ink-soft",
				children: "This can take a short moment. Do not close the page."
			})
		]
	});
	if (phase === "recording") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "relative grid size-14 place-items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pulse-ring absolute inset-0 rounded-full bg-moss" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative size-5 rounded-full bg-moss" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-serif text-3xl text-ink",
					children: "I'm listening"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-sans text-xl tabular-nums text-ink-soft",
					children: formatClock(seconds * 1e3)
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-32 rounded-[22px] border border-rule bg-paper-deep/60 px-5 py-4 text-xl leading-relaxed text-ink",
				children: transcript || live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					transcript,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink-faint",
						children: live
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-ink-faint",
					children: "Go ahead. Tell it the way you would tell a friend."
				})
			}),
			micError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg text-ink-soft",
				children: micError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "xl",
				variant: "ink",
				className: "w-full sm:w-auto",
				onClick: () => void finishTalking(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-5 fill-current" }), "I'm finished"]
			})
		]
	});
	if (phase === "review") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold tracking-[0.18em] text-moss uppercase",
					children: "Your words"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-serif text-3xl text-ink",
					children: "Did I hear you right?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-lg text-ink-soft",
					children: "Fix anything that looks wrong. Then we'll put it in the book."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: transcript,
				onChange: (e) => setTranscript(e.target.value),
				rows: 10,
				className: "w-full rounded-[22px] border border-rule bg-paper px-5 py-4 text-xl leading-relaxed outline-none focus:border-moss",
				placeholder: "Type or paste what you want in the book…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-base text-ink-faint",
				children: [wordCount(transcript), " words"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "text-lg font-bold text-ink",
						children: "Where should this go?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 text-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "radio",
							className: "mt-1.5 size-5 accent-moss",
							checked: destination === "append",
							onChange: () => setDestination("append")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Add it to this chapter", chapter ? ` (“${chapter.title}”)` : ""] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-3 text-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "radio",
							className: "mt-1.5 size-5 accent-moss",
							checked: destination === "new",
							onChange: () => setDestination("new")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Start a new chapter with it" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "xl",
						onClick: () => void writeIntoBook(),
						children: "Write this into the book"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "xl",
						variant: "secondary",
						onClick: () => void startTalking(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-5" }), "Talk again"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "xl",
						variant: "quiet",
						onClick: onClose,
						children: "Cancel"
					})
				]
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-ink-soft",
				children: note
			}) : null
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold tracking-[0.18em] text-moss uppercase",
					children: "Talk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-serif text-3xl text-ink",
					children: "Tell the next part"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-lg text-ink-soft",
					children: "Press the green button and speak. When you are done, press I'm finished. You can also type, or bring in a recording you already have."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "xl",
				className: "w-full sm:w-auto",
				onClick: () => void startTalking(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-6" }), "Start talking"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						variant: "secondary",
						onClick: () => setPhase("review"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keyboard, { className: "size-5" }), "I'd rather type"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						variant: "secondary",
						onClick: () => fileRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-5" }), "I have a recording"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						variant: "quiet",
						onClick: onClose,
						children: "Not now"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "audio/*,.mp3,.wav,.m4a,.ogg,.webm",
				className: "hidden",
				onChange: (e) => {
					const file = e.target.files?.[0];
					if (file) onUpload(file);
					e.target.value = "";
				}
			}),
			micError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg text-ink-soft",
				children: micError
			}) : null
		]
	});
}
function ManuscriptPage({ readMode = false, editable = false }) {
	const { book, chapter, updateChapter } = useBook();
	if (!book || !chapter) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "manuscript-sheet rounded-[28px] px-8 py-16 text-center text-xl text-ink-soft",
		children: "This book has no chapters yet."
	});
	const empty = !chapter.body.trim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `manuscript-sheet mx-auto w-full rounded-[28px] ${readMode ? "max-w-3xl px-8 py-12 sm:px-14 sm:py-16" : "max-w-3xl px-7 py-10 sm:px-12 sm:py-12"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "border-b border-rule pb-6 print-header",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold tracking-[0.2em] text-ink-faint uppercase",
					children: book.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-serif text-3xl leading-tight text-ink sm:text-4xl",
					children: chapter.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-base text-ink-soft",
					children: [
						book.author,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: " · "
						}),
						wordCount(chapter.body),
						" words",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: " · "
						}),
						formatLongDate(chapter.updatedAt)
					]
				})
			]
		}), editable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			value: chapter.body,
			onChange: (e) => updateChapter(chapter.id, {
				body: e.target.value,
				title: chapter.title
			}),
			placeholder: "The page is empty. Press Talk, and we will write what you say here.",
			className: "mt-8 min-h-[28rem] w-full resize-y bg-transparent font-serif leading-[1.7] text-ink outline-none",
			style: { fontSize: "var(--page-size, 1.4rem)" }
		}) : empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-10 font-serif italic text-ink-faint",
			style: { fontSize: "var(--page-size, 1.4rem)" },
			children: "The page is empty. Press Talk, and we will write what you say here."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 space-y-6 font-serif leading-[1.7] text-ink",
			style: { fontSize: "var(--page-size, 1.4rem)" },
			children: chapter.body.split(/\n{2,}/).map((para, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "whitespace-pre-wrap",
				children: para.trim()
			}, i))
		})]
	});
}
function splitForSpeech(text, max = 3800) {
	const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
	const chunks = [];
	let buf = "";
	for (const p of paras) if ((buf + "\n\n" + p).length > max && buf) {
		chunks.push(buf);
		buf = p;
	} else buf = buf ? `${buf}\n\n${p}` : p;
	if (buf) chunks.push(buf);
	return chunks.length ? chunks : [text.slice(0, max)];
}
function ListenBar() {
	const { chapter, sessionsForChapter } = useBook();
	const audioRef = (0, import_react.useRef)(null);
	const stopFlag = (0, import_react.useRef)(false);
	const [playing, setPlaying] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		return () => stopAll();
	}, []);
	function stopAll() {
		stopFlag.current = true;
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.src = "";
		}
		setPlaying(null);
		setStatus("");
	}
	function playUrl(url) {
		return new Promise((resolve, reject) => {
			const el = audioRef.current ?? new Audio();
			audioRef.current = el;
			el.src = url;
			el.onended = () => resolve();
			el.onerror = () => reject(/* @__PURE__ */ new Error("audio"));
			el.play().catch(reject);
		});
	}
	async function listenToPage() {
		const text = chapter?.body.trim() ?? "";
		if (!text) {
			toast("This chapter is still empty.");
			return;
		}
		stopFlag.current = false;
		setPlaying("page");
		setStatus("Reading the page…");
		const chunks = splitForSpeech(text);
		try {
			for (let i = 0; i < chunks.length; i += 1) {
				if (stopFlag.current) return;
				setStatus(chunks.length > 1 ? `Reading the page… ${i + 1} of ${chunks.length}` : "Reading the page…");
				const res = await fetch("/api/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						text: chunks[i],
						voice: "lux"
					})
				});
				if (!res.ok) {
					toast("I could not read the page just now.");
					stopAll();
					return;
				}
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				try {
					await playUrl(url);
				} finally {
					URL.revokeObjectURL(url);
				}
			}
		} catch {
			if (!stopFlag.current) toast("Listening stopped.");
		}
		if (!stopFlag.current) stopAll();
	}
	async function listenToTape() {
		const withAudio = sessionsForChapter.find((s) => s.audioId);
		if (!withAudio?.audioId) {
			toast("There is no original recording for this chapter yet.");
			return;
		}
		const blob = await loadAudio(withAudio.audioId);
		if (!blob) {
			toast("I could not find that recording on this computer.");
			return;
		}
		stopFlag.current = false;
		setPlaying("tape");
		setStatus("Playing what you said…");
		const url = URL.createObjectURL(blob);
		try {
			await playUrl(url);
		} catch {
			toast("The recording would not play.");
		} finally {
			URL.revokeObjectURL(url);
			if (!stopFlag.current) stopAll();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3 sm:flex-row sm:items-center",
		children: playing !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "lg",
			variant: "ink",
			onClick: stopAll,
			children: [playing === "page" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-5 fill-current" }), "Stop"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-lg text-ink-soft",
			children: status
		})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "lg",
			variant: "listen",
			onClick: () => void listenToPage(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5" }), "Listen to the page"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "lg",
			variant: "secondary",
			onClick: () => void listenToTape(),
			disabled: !sessionsForChapter.some((s) => s.audioId),
			children: "Play my recording"
		})] })
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled (default) -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of).
*/
function UserButton() {
	const user = useCurrentUser();
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => void signOut(),
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline",
				children: "Sign out"
			})
		]
	});
}
function GhostwriterApp() {
	const { ready, book, chapter, chapters, state, setCurrent, addChapter, updateChapter, updateBook, updateSettings, createBook } = useBook();
	const [mode, setMode] = (0, import_react.useState)("welcome");
	const [talkOpen, setTalkOpen] = (0, import_react.useState)(false);
	const [typeOpen, setTypeOpen] = (0, import_react.useState)(false);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [editingPage, setEditingPage] = (0, import_react.useState)(false);
	const [helpOpen, setHelpOpen] = (0, import_react.useState)(false);
	const sizeClass = state.settings.typeSize === "xlarge" ? "size-xlarge" : state.settings.typeSize === "comfortable" ? "size-comfortable" : "size-large";
	const totalWords = (0, import_react.useMemo)(() => chapters.reduce((n, c) => n + wordCount(c.body), 0), [chapters]);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-serif text-2xl text-ink-soft",
			children: "Opening the writing room…"
		})
	});
	if (mode === "welcome" && !state.books.some((b) => !b.isSample)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WelcomeFlow, { onEnterDesk: () => setMode("desk") });
	function printNow() {
		window.print();
	}
	function saveCopy() {
		if (!book) return;
		const parts = [
			book.title,
			`by ${book.author}`,
			"",
			...chapters.flatMap((c) => [
				`${c.title}`,
				"",
				c.body.trim(),
				"",
				""
			])
		];
		const slug = book.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "book";
		downloadText(`${slug}.txt`, parts.join("\n"));
		toast("A copy of the book is in your downloads.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `paper-grain min-h-dvh ${sizeClass}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "no-print sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setMode("desk"),
							className: "flex items-center gap-2 pr-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: "size-5 text-moss" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-serif text-xl text-ink",
								children: "Ghostwriter"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-serif text-lg text-ink",
								children: book?.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-sm text-ink-faint",
								children: [book?.author, totalWords ? ` · ${totalWords} words` : ""]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "md",
									variant: mode === "read" ? "primary" : "secondary",
									onClick: () => setMode(mode === "read" ? "desk" : "read"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" }), mode === "read" ? "Writing desk" : "Read"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "md",
									variant: "secondary",
									onClick: printNow,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), "Print"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "md",
									variant: "quiet",
									onClick: () => setSettingsOpen(true),
									"aria-label": "Settings",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Settings"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) })
							]
						})
					]
				})
			}),
			mode === "read" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mx-auto max-w-4xl px-4 py-10 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChapterPicker, {
							chapters,
							currentId: chapter?.id,
							onPick: (id) => book && setCurrent(book.id, id)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListenBar, {})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "print:hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManuscriptPage, { readMode: true })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "no-print mt-10 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							disabled: !chapter || chapters[0]?.id === chapter.id,
							onClick: () => {
								const i = chapters.findIndex((c) => c.id === chapter?.id);
								if (i > 0 && book) setCurrent(book.id, chapters[i - 1].id);
							},
							children: "Previous chapter"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							disabled: !chapter || chapters.at(-1)?.id === chapter.id,
							onClick: () => {
								const i = chapters.findIndex((c) => c.id === chapter?.id);
								if (i >= 0 && i < chapters.length - 1 && book) setCurrent(book.id, chapters[i + 1].id);
							},
							children: "Next chapter"
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[18rem_minmax(0,1fr)] sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "no-print space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[24px] border border-rule bg-paper-deep/40 p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold tracking-[0.16em] text-ink-faint uppercase",
								children: "Chapters"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-1",
								children: chapters.map((c) => {
									const active = c.id === chapter?.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => book && setCurrent(book.id, c.id),
										className: `w-full rounded-[14px] px-3 py-3 text-left text-lg ${active ? "bg-paper text-ink" : "text-ink-soft hover:bg-paper/70"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate font-bold",
											children: c.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-sm text-ink-faint",
											children: wordCount(c.body) ? `${wordCount(c.body)} words` : "Empty"
										})]
									}) }, c.id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "md",
								variant: "secondary",
								className: "mt-3 w-full",
								onClick: () => book && addChapter(book.id),
								children: "New chapter"
							})
						]
					}), !state.settings.helpDismissed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[24px] border border-rule bg-paper p-4 text-base leading-relaxed text-ink-soft",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-ink",
								children: "How this works"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2",
								children: "Talk. We write. You read, listen, or print. Fix anything on the page if we missed a word."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mt-3 text-moss underline-offset-4 hover:underline",
								onClick: () => updateSettings({ helpDismissed: true }),
								children: "Hide this"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-base text-ink-faint underline-offset-4 hover:underline",
						onClick: () => setHelpOpen(true),
						children: "How this works"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "space-y-5",
					children: [
						book?.isSample ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "no-print flex flex-col gap-3 rounded-[24px] border border-rule bg-paper-deep/50 px-5 py-4 text-lg text-ink sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This is a sample, so you can try Read, Listen, and Print before you speak a word." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "md",
								onClick: () => {
									createBook({
										title: "My Story",
										author: "Author",
										kind: "memoir",
										polish: "light",
										voiceNotes: ""
									});
									setSettingsOpen(true);
									toast("Your book is open. Put your name on the title page.");
								},
								children: "Start my book"
							})]
						}) : null,
						talkOpen || typeOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: "no-print rounded-[28px] border border-rule bg-paper p-6 sm:p-8",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TalkFlow, {
								startInType: typeOpen && !talkOpen,
								onClose: () => {
									setTalkOpen(false);
									setTypeOpen(false);
								}
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "no-print rounded-[28px] border border-rule bg-paper p-5 sm:p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-2xl text-ink",
									children: chapter ? chapter.title : "Your book"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-base text-ink-soft",
									children: "Press Talk and tell the next memory. Or type, if you'd rather."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "xl",
										onClick: () => setTalkOpen(true),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-6" }), "Talk"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: "secondary",
										onClick: () => setTypeOpen(true),
										children: "Type instead"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListenBar, {})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "no-print flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-base text-moss underline-offset-4 hover:underline",
								onClick: () => setEditingPage((v) => !v),
								children: editingPage ? "Done editing the page" : "Edit the page myself"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-base text-ink-faint underline-offset-4 hover:underline",
								onClick: saveCopy,
								children: "Save a text copy"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "print:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ManuscriptPage, { editable: editingPage })
						})
					]
				})]
			}),
			settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				title: "Settings",
				onClose: () => setSettingsOpen(false),
				children: book ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Book title",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: book.title,
								onChange: (e) => updateBook(book.id, { title: e.target.value }),
								className: "h-14 w-full rounded-[16px] border border-rule bg-paper px-4 text-lg outline-none focus:border-moss"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Author name on the title page",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: book.author,
								onChange: (e) => updateBook(book.id, { author: e.target.value }),
								className: "h-14 w-full rounded-[16px] border border-rule bg-paper px-4 text-lg outline-none focus:border-moss"
							})
						}),
						chapter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "This chapter’s title",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: chapter.title,
								onChange: (e) => updateChapter(chapter.id, { title: e.target.value }),
								className: "h-14 w-full rounded-[16px] border border-rule bg-paper px-4 text-lg outline-none focus:border-moss"
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
							label: "How we treat your words",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-base text-ink-soft",
								children: POLISH_LABEL[book.polish]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-2",
								children: [
									"faithful",
									"light",
									"literary"
								].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => updateBook(book.id, { polish: p }),
									className: `rounded-[14px] border px-4 py-3 text-left ${book.polish === p ? "border-moss bg-paper-deep" : "border-rule"}`,
									children: POLISH_LABEL[p]
								}, p))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Notes about your voice (optional)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: book.voiceNotes,
								onChange: (e) => updateBook(book.id, { voiceNotes: e.target.value }),
								rows: 3,
								placeholder: "I say y’all. I grew up in Kentucky. Don’t make me sound fancy.",
								className: "w-full rounded-[16px] border border-rule bg-paper px-4 py-3 text-lg outline-none focus:border-moss"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Print and reading size",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									["comfortable", "Comfortable"],
									["large", "Large"],
									["xlarge", "Extra large"]
								].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "md",
									variant: state.settings.typeSize === id ? "primary" : "secondary",
									onClick: () => updateSettings({ typeSize: id }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "size-4" }), label]
								}, id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-base text-ink-faint",
							children: [
								"This is a ",
								KIND_LABEL[book.kind].toLowerCase(),
								". Words stay on this computer unless you print them or save a copy."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => {
									createBook({
										title: "My Story",
										author: book.author,
										kind: book.kind,
										polish: book.polish,
										voiceNotes: book.voiceNotes
									});
									setSettingsOpen(false);
									setMode("desk");
									toast("A fresh book is open.");
								},
								children: "Start another book"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/login",
								className: "inline-flex h-16 items-center justify-center rounded-[18px] px-7 text-lg text-ink-soft underline-offset-4 hover:underline",
								children: "Optional: sign in for a named backup"
							}) })]
						})
					]
				}) : null
			}) : null,
			helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				title: "How this works",
				onClose: () => setHelpOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "space-y-4 text-lg leading-relaxed text-ink-soft",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-ink",
							children: "Talk."
						}), " Press the green button and tell a memory the way you would tell a friend."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-ink",
							children: "We write."
						}), " You will see the words. Fix anything we heard wrong, then put them in the book."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-ink",
							children: "Read."
						}), " Use Read for a quiet page with large type."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-ink",
							children: "Listen or print."
						}), " Listen reads the page aloud. Print uses the printer already on this computer."] })
					]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintBook, {})
		]
	});
}
function PrintBook() {
	const { book, chapters } = useBook();
	if (!book) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "print-only mx-auto max-w-3xl bg-white text-black",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex min-h-[80vh] flex-col items-center justify-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm tracking-[0.25em] uppercase",
					children: "Ghostwriter"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-8 font-serif text-5xl leading-tight",
					children: book.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 font-serif text-2xl",
					children: book.author
				})
			]
		}), chapters.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "break-before-page py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-3xl",
				children: c.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 space-y-5 font-serif text-[14pt] leading-[1.65]",
				children: (c.body.trim() || " ").split(/\n{2,}/).map((para, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "whitespace-pre-wrap",
					children: para.trim()
				}, i))
			})]
		}, c.id))]
	});
}
function ChapterPicker({ chapters, currentId, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center gap-3 text-lg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-ink-soft",
			children: "Chapter"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			value: currentId,
			onChange: (e) => onPick(e.target.value),
			className: "h-12 rounded-[14px] border border-rule bg-paper px-3 text-lg outline-none focus:border-moss",
			children: chapters.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: c.id,
				children: c.title
			}, c.id))
		})]
	});
}
function Modal({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "no-print fixed inset-0 z-40 grid place-items-end bg-ink/40 p-3 sm:place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			className: "max-h-[90dvh] w-full max-w-xl overflow-auto rounded-[28px] bg-paper p-6 shadow-2xl sm:p-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-3xl text-ink",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "md",
					variant: "quiet",
					onClick: onClose,
					children: "Close"
				})]
			}), children]
		})
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-base font-bold text-ink",
			children: label
		}), children]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostwriterApp, {});
}
//#endregion
export { Home as component };
