import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import { LOCAL_MODEL, LOCAL_MODEL_REVISION, type SpeechReply } from "../lib/local-speech";
import wasmUrl from "../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url";
import wasmModuleUrl from "../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url";

env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl };
}
let model: AutomaticSpeechRecognitionPipeline | null = null;
const send = (reply: SpeechReply) => self.postMessage(reply);
let busy = false;
self.onmessage = async (
  event: MessageEvent<{ type: "prepare" | "transcribe" | "dispose"; audio?: Float32Array }>,
) => {
  if (busy) return;
  busy = true;
  try {
    if (event.data.type === "dispose") {
      await model?.dispose();
      model = null;
      self.close();
      return;
    }
    if (!model) {
      model = await pipeline<"automatic-speech-recognition">(
        "automatic-speech-recognition",
        LOCAL_MODEL,
        {
          revision: LOCAL_MODEL_REVISION,
          device: "wasm",
          dtype: "q8",
          progress_callback: (progress) => {
            if (progress.status === "progress")
              send({
                type: "progress",
                message: `Downloading speech files… ${Math.round(progress.progress)}% of this file`,
              });
            else if (progress.status === "done")
              send({ type: "progress", message: "Preparing private dictation…" });
          },
        },
      );
    }
    if (event.data.type === "prepare") {
      send({ type: "ready" });
      return;
    }
    if (!event.data.audio?.length) throw new Error("No audio to transcribe.");
    send({ type: "progress", message: "Turning your recording into words on this computer…" });
    const result = await model(event.data.audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });
    send({ type: "result", text: (Array.isArray(result) ? result[0].text : result.text).trim() });
  } catch {
    send({
      type: "error",
      message:
        "Private dictation could not finish. Check the connection for the first download, then try again. Your recording has not been uploaded.",
    });
  } finally {
    busy = false;
  }
};
