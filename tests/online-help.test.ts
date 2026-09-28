import assert from "node:assert/strict";
import test from "node:test";
import {
  writingHelp,
  onlineHelpEnabled,
  type OnlineHelpConfig,
} from "../src/lib/server/online-help";

const config: OnlineHelpConfig = {
  GHOSTWRITER_ONLINE_HELP: "true",
  XAI_API_KEY: "synthetic-test-value",
  ONLINE_HELP_MODEL: "configurable-test-model",
  ONLINE_HELP_LIMITER: { limit: async () => ({ success: true }) },
};
const identity = { sub: "synthetic-person", email: "person@example.test" };
const data = {
  transcript: "My own words.",
  kind: "memoir",
  polish: "faithful",
  voiceNotes: "",
  onlineConsent: true,
};
const request = (body: unknown, origin = "https://writer.example.test") =>
  new Request("https://writer.example.test/api/writing-help", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const noFetch: typeof fetch = async () => {
  assert.fail("provider must not be called");
};

test("online help stays disabled without flag, key, model and limiter", async () => {
  for (const part of [
    {},
    { ...config, GHOSTWRITER_ONLINE_HELP: "false" },
    { ...config, XAI_API_KEY: undefined },
    { ...config, ONLINE_HELP_MODEL: undefined },
    { ...config, ONLINE_HELP_LIMITER: undefined },
  ]) {
    assert.equal(onlineHelpEnabled(part), false);
    assert.equal((await writingHelp(request(data), part, identity, noFetch)).status, 503);
  }
});
test("requires per-passage consent, strict text-only fields and same origin", async () => {
  for (const body of [
    { ...data, onlineConsent: false },
    { ...data, audio: "bytes" },
    { ...data, chapter: "private chapter" },
    { ...data, transcript: "x".repeat(16001) },
    { ...data, transcript: "" },
  ]) {
    assert.equal((await writingHelp(request(body), config, identity, noFetch)).status, 400);
  }
  assert.equal(
    (await writingHelp(request(data, "https://other.test"), config, identity, noFetch)).status,
    403,
  );
  assert.equal(
    (
      await writingHelp(
        request({ ...data, transcript: "x".repeat(80001) }),
        config,
        identity,
        noFetch,
      )
    ).status,
    413,
  );
});
test("rate limiting denies calls without spending provider credits", async () => {
  const limited = { ...config, ONLINE_HELP_LIMITER: { limit: async () => ({ success: false }) } };
  assert.equal((await writingHelp(request(data), limited, identity, noFetch)).status, 429);
});

test("malformed JSON is a client error and never reaches the provider", async () => {
  const malformed = new Request("https://writer.example.test/api/writing-help", {
    method: "POST",
    headers: { origin: "https://writer.example.test", "content-type": "application/json" },
    body: "{broken",
  });
  assert.equal((await writingHelp(malformed, config, identity, noFetch)).status, 400);
});
test("uses configured model, bounded output, timeout and passage only", async () => {
  const response = await writingHelp(request(data), config, identity, async (url, init) => {
    assert.equal(url, "https://api.x.ai/v1/chat/completions");
    const body = JSON.parse(init!.body as string);
    assert.equal(body.model, "configurable-test-model");
    assert.equal(body.max_tokens, 8192);
    assert.ok(init!.signal);
    assert.deepEqual(JSON.parse(body.messages[1].content), {
      voiceNotes: "",
      passage: "My own words.",
    });
    return Response.json({
      choices: [{ finish_reason: "stop", message: { content: '{"body":"My own words."}' } }],
    });
  });
  assert.deepEqual(await response.json(), { ok: true, body: "My own words." });
});
test("provider failures never expose submitted text, keys or upstream diagnostics", async () => {
  const response = await writingHelp(request(data), config, identity, async () => {
    throw new Error("secret submitted text");
  });
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.ok(!text.includes("secret") && !text.includes("My own words."));
});
