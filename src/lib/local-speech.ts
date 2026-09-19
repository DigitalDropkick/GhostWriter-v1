export const LOCAL_MODEL = "Xenova/whisper-tiny.en";
export const LOCAL_MODEL_REVISION = "79fb389fc764e7c395bd330e9531d9d32ada7049";
export const MAX_RECORDING_BYTES = 100 * 1024 * 1024;

export type SpeechReply =
  | { type: "progress"; message: string }
  | { type: "ready" }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

// Decode locally, downmix, and resample to Whisper's 16 kHz input.
export async function decodeRecording(blob: Blob): Promise<Float32Array> {
  if (!blob.size || blob.size > MAX_RECORDING_BYTES)
    throw new Error("Choose a recording smaller than 100 MB.");
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > 60 * 60)
      throw new Error("Please split recordings longer than an hour into shorter parts.");
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const mono = (await offline.startRendering()).getChannelData(0);
    let peak = 0;
    for (const sample of mono) peak = Math.max(peak, Math.abs(sample));
    if (peak < 0.002)
      throw new Error(
        "This recording is very quiet. Check the microphone, or choose another recording.",
      );
    return mono;
  } finally {
    await context.close();
  }
}

export function splitForSpeech(text: string, max = 240): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining) {
    let end = Math.min(max, remaining.length);
    if (end < remaining.length) {
      const punctuation = Math.max(
        remaining.lastIndexOf(". ", end),
        remaining.lastIndexOf("? ", end),
        remaining.lastIndexOf("! ", end),
      );
      const space = remaining.lastIndexOf(" ", end);
      end = punctuation > end / 2 ? punctuation + 1 : space > 0 ? space : end;
    }
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  return chunks;
}
