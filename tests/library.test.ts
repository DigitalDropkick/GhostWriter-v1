import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import {
  emptyState,
  loadState,
  saveState,
  saveAudio,
  loadAudio,
  SaveConflictError,
} from "../src/lib/storage";
import { parseState } from "../src/lib/state-schema";
import { parseBackup, prepareImport } from "../src/lib/backup";
import { splitForSpeech } from "../src/lib/local-speech";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

test("a new library loads without writing a sample over storage", async () => {
  assert.equal((await loadState()).revision, 0);
  assert.equal((await loadState()).state.books[0].isSample, true);
  assert.equal((await loadState()).revision, 0);
});
test("legacy books round-trip and retain long chapters and Unicode", async () => {
  const state = emptyState();
  state.chapters[0].body = "His classroom — café, family, y’all.\n\n".repeat(4000);
  delete state.revisions;
  delete state.draft;
  await saveState(state, 0);
  assert.deepEqual((await loadState()).state, state);
});
test("a stale tab cannot overwrite a newer library", async () => {
  const old = await loadState();
  const fresh = { ...old.state, settings: { ...old.state.settings, helpDismissed: true } };
  await saveState(fresh, old.revision);
  await assert.rejects(saveState(old.state, old.revision), SaveConflictError);
  assert.deepEqual((await loadState()).state, fresh);
});
test("storage read failure rejects instead of returning the sample", async () => {
  globalThis.indexedDB = {
    open: () => {
      throw new DOMException("Unavailable", "SecurityError");
    },
  } as unknown as IDBFactory;
  await assert.rejects(loadState());
});
test("corrupt stored data is preserved and rejected", async () => {
  await saveState(emptyState(), 0);
  const db = await new Promise<IDBDatabase>((resolve) => {
    const req = indexedDB.open("ghostwriter");
    req.onsuccess = () => resolve(req.result);
  });
  const tx = db.transaction("kv", "readwrite");
  tx.objectStore("kv").put({ books: [] }, "state");
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
  await assert.rejects(loadState());
  await assert.rejects(loadState());
});
test("audio is stored as the original bytes", async () => {
  const audio = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/webm" });
  await saveAudio("recording", audio);
  assert.deepEqual(await (await loadAudio("recording"))!.arrayBuffer(), await audio.arrayBuffer());
});
test("malformed library relationships and duplicate ids are rejected", () => {
  const state = emptyState();
  assert.throws(() =>
    parseState({ ...state, chapters: [{ ...state.chapters[0], bookId: "missing" }] }),
  );
  assert.throws(() => parseState({ ...state, books: [...state.books, state.books[0]] }));
});
test("incomplete backups cannot silently drop recordings", () => {
  const state = emptyState();
  state.sessions = [
    {
      id: "s",
      bookId: state.books[0].id,
      chapterId: state.chapters[0].id,
      transcript: "hello",
      audioId: "missing",
      durationMs: 1000,
      createdAt: 1,
    },
  ];
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        format: "ghostwriter-backup",
        version: 1,
        createdAt: "today",
        state,
        audio: [],
      }),
    ),
  );
});
test("restoring a backup remaps all links and retains recording bytes", async () => {
  const state = emptyState();
  state.sessions = [
    {
      id: "s",
      bookId: state.books[0].id,
      chapterId: state.chapters[0].id,
      transcript: "hello",
      audioId: "a",
      durationMs: 1000,
      createdAt: 1,
    },
  ];
  state.draft = { ...state.sessions[0], transcript: "unfinished" };
  state.revisions = [
    { id: "r", chapterId: state.chapters[0].id, body: "old", title: "Old page", createdAt: 1 },
  ];
  const imported = await prepareImport(
    parseBackup(
      JSON.stringify({
        format: "ghostwriter-backup",
        version: 1,
        createdAt: "today",
        state,
        audio: [{ id: "a", type: "audio/webm", data: "AQIDBA==" }],
      }),
    ),
  );
  assert.notEqual(imported.books[0].id, state.books[0].id);
  assert.equal(imported.chapters[0].bookId, imported.books[0].id);
  assert.equal(imported.sessions[0].chapterId, imported.chapters[0].id);
  assert.equal(imported.draft!.audioId, imported.sessions[0].audioId);
  assert.equal(imported.revisions![0].chapterId, imported.chapters[0].id);
  assert.equal(imported.currentChapterId, imported.chapters[0].id);
  assert.deepEqual(
    new Uint8Array(await (await loadAudio(imported.sessions[0].audioId!))!.arrayBuffer()),
    new Uint8Array([1, 2, 3, 4]),
  );
  assert.deepEqual(parseState(imported), imported);
});
test("private reading covers a long paragraph with no silent truncation", () => {
  const text = "A long classroom story. ".repeat(500).trim();
  const chunks = splitForSpeech(text);
  assert.ok(chunks.length > 10);
  assert.ok(chunks.every((c) => c.length <= 240));
  assert.equal(chunks.join(" "), text);
});
test("private reading splits oversized words and handles empty pages", () => {
  assert.equal(splitForSpeech("x".repeat(1000)).join(""), "x".repeat(1000));
  assert.deepEqual(splitForSpeech("  "), []);
});
