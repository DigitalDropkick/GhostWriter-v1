import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import {
  emptyState,
  loadState,
  saveState,
  saveAudio,
  loadAudio,
  SaveConflictError,
} from "../src/lib/storage";
import { parseState } from "../src/lib/state-schema";
import { createBackup, parseBackup, prepareImport } from "../src/lib/backup";
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
test("multi-megabyte recording backups validate without regexp stack overflow", () => {
  const data = "A".repeat(8 * 1024 * 1024);
  const backup = { format: "ghostwriter-backup", version: 1, createdAt: "today", state: emptyState(),
    audio: [{ id: "large", type: "audio/webm", data }] };
  assert.equal(parseBackup(JSON.stringify(backup)).audio[0].data.length, data.length);
  for (const invalid of ["A", "AA=", "A===", "AAAA=AAA", "AA A", "!!!!"])
    assert.throws(() => parseBackup(JSON.stringify({ ...backup, audio: [{ ...backup.audio[0], data: invalid }] })));
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
  const prepared = prepareImport(
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
  const imported = prepared.state;
  assert.equal(await loadAudio(imported.sessions[0].audioId!), null);
  await saveState(imported, 0, prepared.audio);
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
test("failed restore rolls back every recording and the library together", async () => {
  const original = emptyState();
  await saveState(original, 0);
  const put = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
    if (key === "state") throw new DOMException("Disk full", "QuotaExceededError");
    return put.call(this, value, key);
  };
  try {
    await assert.rejects(saveState({ ...original, books: [] }, 1, [
      { id: "import-one", blob: new Blob(["one"]) },
      { id: "import-two", blob: new Blob(["two"]) },
    ]));
  } finally {
    IDBObjectStore.prototype.put = put;
  }
  assert.deepEqual((await loadState()).state, original);
  assert.equal((await loadState()).revision, 1);
  assert.equal(await loadAudio("import-one"), null);
  assert.equal(await loadAudio("import-two"), null);
});
test("a conflicting restore writes neither audio nor library", async () => {
  const state = emptyState();
  await saveState(state, 0);
  await assert.rejects(saveState(state, 0, [{ id: "conflict-audio", blob: new Blob(["a"]) }]), SaveConflictError);
  assert.equal(await loadAudio("conflict-audio"), null);
});
test("a text-only backup preserves all words without reading missing audio", async () => {
  const state = emptyState();
  state.draft = {
    bookId: state.books[0].id, chapterId: state.chapters[0].id,
    transcript: "Keep my corrected words.", originalTranscript: "Original words.",
    audioId: "missing", durationMs: 1000,
  };
  state.revisions = [{ id: "r", chapterId: state.chapters[0].id, title: "Earlier", body: "Old words.", createdAt: 1 }];
  await assert.rejects(createBackup(state), /recording is missing/);
  const recovered = parseBackup(await createBackup(state, [], false));
  assert.deepEqual(recovered.state.books, state.books);
  assert.deepEqual(recovered.state.chapters, state.chapters);
  assert.deepEqual(recovered.state.revisions, state.revisions);
  assert.deepEqual(recovered.state.draft, { ...state.draft, audioId: null });
  assert.deepEqual(recovered.audio, []);
  assert.equal(state.draft.audioId, "missing");
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
